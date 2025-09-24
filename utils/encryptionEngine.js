/**
 * Asocial Encryption Engine
 * Handles message encryption and decryption with group-based access control
 */

class AsocialEncryptionEngine {
  constructor() {
    this.crypto = new AsocialCrypto();
    this.keyManager = new AsocialKeyManager();
    this.messageTagPrefix = '[ASOCIAL';
  }

  /**
   * Encrypt message for specific key group
   */
  async encryptMessage(message, writerKey) {
    try {
      console.log(`Encrypting message with writer key: ${writerKey.name}`);
      
      // Validate message size (LinkedIn limit: 3000 chars)
      if (message.length > 3000) {
        throw new Error('Message too long (max 3000 characters for LinkedIn)');
      }
      
      // Generate random AES-256 symmetric key
      const symmetricKey = await this.crypto.generateSymmetricKey();
      
      // Encrypt message content with AES-256-GCM
      const { encryptedData, iv } = await this.crypto.encryptMessage(message, symmetricKey);
      
      // Get public key from the writer key
      const publicKey = await this.crypto.importKey(writerKey.publicKey, 'public', ['encrypt']);
      
      // Encrypt symmetric key with RSA-2048
      const encryptedSymmetricKey = await this.crypto.encryptSymmetricKey(symmetricKey, publicKey);
      
      // Note: RSA-OAEP doesn't support signing, so we skip signature for now
      // In a production system, you'd use a separate RSA-PSS key pair for signing
      const signature = new ArrayBuffer(0); // Empty signature
      
      // Get writer key info for sender identification
      const keyId = writerKey.keyId ? writerKey.keyId.toUpperCase() : 'UNKNOWN';
      
      // Create compact payload (minimal metadata)
      const payload = {
        v: '1.0', // version
        d: this.arrayBufferToBase64(encryptedData), // encrypted data
        k: this.arrayBufferToBase64(encryptedSymmetricKey), // encrypted key
        i: this.arrayBufferToBase64(iv), // iv
        t: Date.now() // timestamp (number instead of ISO string)
      };
      
      // Create final encrypted message with key ID
      const encryptedMessage = `${this.messageTagPrefix} ${keyId}] ${btoa(JSON.stringify(payload))}`;
      
      // Check if encrypted message is too long for LinkedIn
      if (encryptedMessage.length > 3000) {
        throw new Error(`Encrypted message too long (${encryptedMessage.length} chars). Try a shorter message.`);
      }
      
      console.log(`Message encrypted successfully (${encryptedMessage.length} chars)`);
      return encryptedMessage;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt message if user has the correct key
   */
  async decryptMessage(encryptedMessage) {
    try {
      console.log('Attempting to decrypt message');
      console.log('Full message content:', encryptedMessage);
      console.log('Message length:', encryptedMessage.length);
      
      // Check if message has our tag and extract key ID (more flexible regex)
      const tagMatch = encryptedMessage.match(/\[ASOCIAL\s+([A-Z0-9]+)\]/);
      console.log('Tag match result:', tagMatch);
      
      // Also try alternative patterns
      const altMatch1 = encryptedMessage.match(/\[ASOCIAL\s([A-Z0-9]+)\]/);
      const altMatch2 = encryptedMessage.match(/\[ASOCIAL\s*([A-Z0-9]+)\]/);
      console.log('Alternative match 1:', altMatch1);
      console.log('Alternative match 2:', altMatch2);
      
      // Use the first successful match
      const finalMatch = tagMatch || altMatch1 || altMatch2;
      
      if (!finalMatch) {
        console.error('Message format not recognized. Expected format: [ASOCIAL KEYID] encrypted_content');
        console.error('Actual message:', encryptedMessage);
        console.error('Message starts with:', encryptedMessage.substring(0, 20));
        throw new Error('Not an Asocial encrypted message');
      }
      
      const keyId = finalMatch[1];
      console.log(`Message encrypted with key ID: ${keyId}`);
      
      // Extract payload
      const payloadStart = encryptedMessage.indexOf('] ') + 2;
      const payloadBase64 = encryptedMessage.substring(payloadStart);
      const payload = JSON.parse(atob(payloadBase64));
      
      // Validate payload structure (handle both old and new formats)
      const encryptedData = payload.encryptedData || payload.d;
      const encryptedSymmetricKey = payload.encryptedSymmetricKey || payload.k;
      const iv = payload.iv || payload.i;
      
      if (!encryptedData || !encryptedSymmetricKey || !iv) {
        throw new Error('Invalid encrypted message format');
      }
      
      // First try to find a reader key with matching key ID
      console.log(`Looking for reader key with key ID: ${keyId}`);
      
      // Debug: List all available reader keys
      const allReaderKeys = await this.keyManager.getReaderKeys();
      console.log('All available reader keys:', allReaderKeys);
      console.log('Reader key IDs:', allReaderKeys.map(key => key.keyId));
      
      const readerKey = await this.keyManager.getReaderKeyByKeyId(keyId);
      console.log('Reader key found:', readerKey);
      
      let privateKey, keySource;
      
      if (readerKey) {
        console.log(`Found matching reader key: ${readerKey.senderName} (${readerKey.keyId})`);
        // Import the reader's private key
        privateKey = await this.crypto.importKey(readerKey.privateKey, 'private', ['decrypt']);
        keySource = { type: 'reader', name: readerKey.senderName, id: readerKey.id };
      } else {
        // Fall back to checking groups (for backward compatibility)
        const groups = await this.keyManager.getKeyGroups();
        const matchingGroup = groups.find(group => group.keyId.toUpperCase() === keyId.toUpperCase());
        
        if (!matchingGroup) {
          throw new Error(`No key found for key ID: ${keyId}`);
        }
        
        console.log(`Found matching group: ${matchingGroup.name} (${matchingGroup.keyId})`);
        privateKey = await this.keyManager.getPrivateKeyForGroup(matchingGroup.id);
        keySource = { type: 'group', name: matchingGroup.name, id: matchingGroup.id };
      }
      
      try {
        
        // Decrypt symmetric key
        const encryptedSymmetricKeyBuffer = this.base64ToArrayBuffer(encryptedSymmetricKey);
        const symmetricKey = await this.crypto.decryptSymmetricKey(encryptedSymmetricKeyBuffer, privateKey);
        
        // Decrypt message content
        const encryptedDataBuffer = this.base64ToArrayBuffer(encryptedData);
        const ivBuffer = this.base64ToArrayBuffer(iv);
        const decryptedMessage = await this.crypto.decryptMessage(
          encryptedDataBuffer, 
          ivBuffer, 
          symmetricKey
        );
        
        // Skip signature verification since we're not using signatures with RSA-OAEP
        console.log(`✅ Message decrypted successfully with ${keySource.type}: ${keySource.name}`);
        return {
          message: decryptedMessage,
          groupName: keySource.name,
          groupId: keySource.id,
          keyId: keyId,
          keyType: keySource.type,
          timestamp: payload.timestamp || new Date(payload.t).toISOString(),
          algorithm: payload.algorithm || 'RSA-2048/AES-256-GCM',
          sender: payload.sender || 'Unknown'
        };
      } catch (error) {
        console.error(`❌ Failed to decrypt with key ID ${keyId}:`, error.message);
        throw new Error(`Decryption failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Detect encrypted messages on the page
   */
  detectEncryptedMessages() {
    const messages = [];
    
    // Look for encrypted messages in various LinkedIn post containers
    const postSelectors = [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '.feed-shared-text__text-view',
      '.comments-comment-item-content-body',
      '.msg-s-message-list-content',
      '.feed-shared-inline-show-more-text',
      '.msg-s-event-listitem__body',
      'p.msg-s-event-listitem__body',
      'p[class*="msg-s-event-listitem__body"]',
      '.msg-s-message-list-item__body',
      '.msg-s-message-list-item__content',
      '.msg-s-message-list-item__text',
      '.msg-s-message-list-item__body-text',
      'p[class*="msg-s-event-listitem"]',
      'p[class*="msg-s-message-list-item"]',
      // Broader selectors for chat messages
      'p[class*="msg-s-event"]',
      'p[class*="msg-s-message"]',
      'p[class*="t-14"]',
      'p[class*="t-black"]',
      // Fallback: check all p elements in message containers
      '.msg-s-event-listitem p',
      '.msg-s-message-list-item p',
      '.msg-s-message-list p'
    ];
    
    for (const selector of postSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`Checking selector "${selector}": found ${elements.length} elements`);
      
      for (const element of elements) {
        // Log element details for debugging
        console.log(`Element classes: ${element.className}, text: ${element.textContent.substring(0, 50)}...`);
        
        if (element.textContent && element.textContent.includes(this.messageTagPrefix)) {
          console.log(`Found potential encrypted message in ${selector}:`, element.textContent.substring(0, 100));
          
          // Check if already processed
          if (element.classList.contains('asocial-processed')) {
            console.log('Message already processed, skipping');
            continue;
          }
          
          // Check if this is actually an encrypted message (starts with [ASOCIAL)
          if (!element.textContent.trim().startsWith('[ASOCIAL')) {
            console.log('Message does not start with [ASOCIAL, skipping');
            continue;
          }
          
          console.log('Adding encrypted message to processing queue');
          messages.push({
            node: element,
            text: element.textContent,
            isEncrypted: true
          });
        }
      }
    }
    
    // Also check text nodes as fallback
    const textNodes = this.getTextNodes(document.body);
    for (const node of textNodes) {
      if (node.textContent.includes(this.messageTagPrefix)) {
        // Check if already processed
        if (node.parentElement && node.parentElement.classList.contains('asocial-processed')) {
          continue;
        }
        
        messages.push({
          node: node,
          text: node.textContent,
          isEncrypted: true
        });
      }
    }
    
    // Final fallback: check ALL p elements on the page
    console.log('Running final fallback: checking ALL p elements on page');
    const allPElements = document.querySelectorAll('p');
    console.log(`Found ${allPElements.length} total p elements on page`);
    
    for (const pElement of allPElements) {
      if (pElement.textContent && pElement.textContent.includes(this.messageTagPrefix)) {
        console.log(`FALLBACK: Found encrypted message in p element with classes: ${pElement.className}`);
        console.log(`FALLBACK: Message content: ${pElement.textContent.substring(0, 100)}`);
        
        // Check if already processed
        if (pElement.classList.contains('asocial-processed')) {
          console.log('FALLBACK: Message already processed, skipping');
          continue;
        }
        
        // Check if this is actually an encrypted message (starts with [ASOCIAL)
        if (!pElement.textContent.trim().startsWith('[ASOCIAL')) {
          console.log('FALLBACK: Message does not start with [ASOCIAL, skipping');
          continue;
        }
        
        console.log('FALLBACK: Adding encrypted message to processing queue');
        messages.push({
          node: pElement,
          text: pElement.textContent,
          isEncrypted: true
        });
      }
    }
    
    return messages;
  }

  /**
   * Replace encrypted message with decrypted content
   */
  async replaceEncryptedMessage(node, decryptedContent) {
    try {
      const textContent = node.textContent;
      
      // Find the encrypted part
      const encryptedStart = textContent.indexOf(this.messageTagPrefix);
      if (encryptedStart === -1) return;
      
      const beforeEncrypted = textContent.substring(0, encryptedStart);
      const afterEncrypted = textContent.substring(encryptedStart);
      
      // Find the end of the encrypted message (look for end of base64)
      const encryptedEnd = this.findEncryptedMessageEnd(afterEncrypted);
      const encryptedPart = afterEncrypted.substring(0, encryptedEnd);
      const afterPart = afterEncrypted.substring(encryptedEnd);
      
      // Create replacement content
      const replacement = document.createElement('div');
      replacement.className = 'asocial-decrypted-message';
      replacement.innerHTML = `
        <div class="asocial-message-header">
          <span class="asocial-tag">🔒 Decrypted Message</span>
          <button class="asocial-toggle">
            Show Encrypted
          </button>
        </div>
        <div class="asocial-content">${this.escapeHtml(decryptedContent)}</div>
        <div class="asocial-encrypted" style="display: none;"></div>
      `;
      
      // Store encrypted content in data attribute for the toggle
      replacement.setAttribute('data-encrypted-content', encryptedPart);
      
      // Mark as processed to avoid re-processing
      replacement.classList.add('asocial-processed');
      
      // Completely remove encrypted content from DOM to prevent URL exposure
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Store the encrypted content in a data attribute for potential restoration
        replacement.setAttribute('data-asocial-encrypted', encryptedPart);
        replacement.classList.add('asocial-processed');
        
        // Clear the original node completely
        node.innerHTML = '';
        node.textContent = '';
        node.classList.add('asocial-processed');
        
        // Insert our replacement after the original node
        if (node.parentNode) {
          node.parentNode.insertBefore(replacement, node.nextSibling);
          
          // Add event listener after the element is in the DOM
          const toggleButton = replacement.querySelector('.asocial-toggle');
          console.log('Toggle button found:', toggleButton);
          if (toggleButton) {
            console.log('Adding click listener to toggle button');
            toggleButton.addEventListener('click', (e) => {
              console.log('Toggle button clicked!');
              e.preventDefault();
              e.stopPropagation();
              
              const encryptedDiv = replacement.querySelector('.asocial-encrypted');
              console.log('Encrypted div found:', encryptedDiv);
              if (encryptedDiv) {
                if (encryptedDiv.textContent === '') {
                  console.log('Loading encrypted content...');
                  encryptedDiv.textContent = replacement.getAttribute('data-encrypted-content');
                }
                replacement.classList.toggle('show-encrypted');
                console.log('Toggled show-encrypted class:', replacement.classList.contains('show-encrypted'));
                console.log('Element classes:', replacement.className);
                console.log('Encrypted div display style:', getComputedStyle(encryptedDiv).display);
                
                // Update button text
                const buttonText = replacement.classList.contains('show-encrypted') ? 'Hide Encrypted' : 'Show Encrypted';
                toggleButton.textContent = buttonText;
                console.log('Updated button text to:', buttonText);
              }
            });
          } else {
            console.error('Toggle button not found!');
          }
        }
      } else {
        // For text nodes, completely remove the encrypted content
        const parent = node.parentNode;
        if (parent) {
          // Store encrypted content in parent's data attribute
          parent.setAttribute('data-asocial-encrypted', encryptedPart);
          
          // Replace the text node with our content
          const newTextNode = document.createTextNode(beforeEncrypted);
          parent.replaceChild(newTextNode, node);
          parent.insertBefore(replacement, newTextNode.nextSibling);
          parent.insertBefore(document.createTextNode(afterPart), replacement.nextSibling);
          
          // Add event listener after the element is in the DOM
          const toggleButton = replacement.querySelector('.asocial-toggle');
          console.log('Toggle button found (text node):', toggleButton);
          if (toggleButton) {
            console.log('Adding click listener to toggle button (text node)');
            toggleButton.addEventListener('click', (e) => {
              console.log('Toggle button clicked (text node)!');
              e.preventDefault();
              e.stopPropagation();
              
              const encryptedDiv = replacement.querySelector('.asocial-encrypted');
              console.log('Encrypted div found (text node):', encryptedDiv);
              if (encryptedDiv) {
                if (encryptedDiv.textContent === '') {
                  console.log('Loading encrypted content (text node)...');
                  encryptedDiv.textContent = replacement.getAttribute('data-encrypted-content');
                }
                replacement.classList.toggle('show-encrypted');
                console.log('Toggled show-encrypted class (text node):', replacement.classList.contains('show-encrypted'));
                console.log('Element classes:', replacement.className);
                console.log('Encrypted div display style:', getComputedStyle(encryptedDiv).display);
                
                // Update button text
                const buttonText = replacement.classList.contains('show-encrypted') ? 'Hide Encrypted' : 'Show Encrypted';
                toggleButton.textContent = buttonText;
                console.log('Updated button text to (text node):', buttonText);
              }
            });
          } else {
            console.error('Toggle button not found (text node)!');
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to replace encrypted message:', error);
    }
  }

  /**
   * Show "cannot decrypt" message
   */
  showCannotDecryptMessage(node) {
    const parent = node.parentNode;
    const textContent = node.textContent;
    
    const encryptedStart = textContent.indexOf(this.messageTag);
    if (encryptedStart === -1) return;
    
    const beforeEncrypted = textContent.substring(0, encryptedStart);
    const afterEncrypted = textContent.substring(encryptedStart);
    const encryptedEnd = this.findEncryptedMessageEnd(afterEncrypted);
    const encryptedPart = afterEncrypted.substring(0, encryptedEnd);
    const afterPart = afterEncrypted.substring(encryptedEnd);
    
    const replacement = document.createElement('span');
    replacement.className = 'asocial-cannot-decrypt';
    replacement.innerHTML = `
      <div class="asocial-message-header">
        <span class="asocial-tag">🔒 Encrypted Message</span>
        <span class="asocial-status">Cannot decrypt - missing key</span>
      </div>
      <div class="asocial-encrypted">${this.escapeHtml(encryptedPart)}</div>
    `;
    
    const newTextNode = document.createTextNode(beforeEncrypted);
    parent.insertBefore(newTextNode, node);
    parent.insertBefore(replacement, node);
    parent.insertBefore(document.createTextNode(afterPart), node);
    parent.removeChild(node);
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Utility: Get all text nodes in element
   */
  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  /**
   * Utility: Find end of encrypted message
   */
  findEncryptedMessageEnd(text) {
    // Look for the end of base64 string (simplified)
    let end = text.length;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ' && i > 100) { // Base64 strings are long
        end = i;
        break;
      }
    }
    return end;
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialEncryptionEngine;
} else {
  window.AsocialEncryptionEngine = AsocialEncryptionEngine;
}
