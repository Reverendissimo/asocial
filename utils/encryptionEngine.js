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
  async encryptMessage(message, groupId) {
    try {
      console.log(`Encrypting message for group: ${groupId}`);
      
      // Validate message size (LinkedIn limit: 3000 chars)
      if (message.length > 3000) {
        throw new Error('Message too long (max 3000 characters for LinkedIn)');
      }
      
      // Generate random AES-256 symmetric key
      const symmetricKey = await this.crypto.generateSymmetricKey();
      
      // Encrypt message content with AES-256-GCM
      const { encryptedData, iv } = await this.crypto.encryptMessage(message, symmetricKey);
      
      // Get private key for the group
      const privateKey = await this.keyManager.getPrivateKeyForGroup(groupId);
      
      // Encrypt symmetric key with RSA-4096
      const encryptedSymmetricKey = await this.crypto.encryptSymmetricKey(symmetricKey, privateKey);
      
      // Sign the message for authenticity
      const signature = await this.crypto.signMessage(message, privateKey);
      
      // Get group info for sender identification
      const group = await this.keyManager.getKeyGroup(groupId);
      const groupName = group ? group.name : 'Unknown Group';
      const keyId = group ? group.keyId : 'UNKNOWN';
      
      // Create payload
      const payload = {
        version: '1.0',
        algorithm: 'RSA-4096/AES-256-GCM',
        groupId: groupId,
        groupName: groupName,
        sender: 'You', // This would be the actual sender name
        encryptedData: this.arrayBufferToBase64(encryptedData),
        encryptedSymmetricKey: this.arrayBufferToBase64(encryptedSymmetricKey),
        iv: this.arrayBufferToBase64(iv),
        signature: this.arrayBufferToBase64(signature),
        timestamp: new Date().toISOString()
      };
      
      // Create final encrypted message with key ID
      const encryptedMessage = `${this.messageTagPrefix} ${keyId}] ${btoa(JSON.stringify(payload))}`;
      
      console.log('Message encrypted successfully');
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
      
      // Check if message has our tag and extract key ID
      const tagMatch = encryptedMessage.match(/^\[ASOCIAL\s+([A-Z0-9]+)\]/);
      if (!tagMatch) {
        throw new Error('Not an Asocial encrypted message');
      }
      
      const keyId = tagMatch[1];
      console.log(`Message encrypted with key ID: ${keyId}`);
      
      // Extract payload
      const payloadStart = encryptedMessage.indexOf('] ') + 2;
      const payloadBase64 = encryptedMessage.substring(payloadStart);
      const payload = JSON.parse(atob(payloadBase64));
      
      // Validate payload structure
      if (!payload.encryptedData || !payload.encryptedSymmetricKey || !payload.iv) {
        throw new Error('Invalid encrypted message format');
      }
      
      // Find the group with matching key ID
      const groups = await this.keyManager.getKeyGroups();
      const matchingGroup = groups.find(group => group.keyId === keyId);
      
      if (!matchingGroup) {
        throw new Error(`No key found for key ID: ${keyId}`);
      }
      
      console.log(`Found matching group: ${matchingGroup.name} (${matchingGroup.keyId})`);
      
      try {
        // Get public key for this group
        const publicKey = await this.keyManager.getPublicKeyForGroup(matchingGroup.id);
        
        // Decrypt symmetric key
        const encryptedSymmetricKeyBuffer = this.base64ToArrayBuffer(payload.encryptedSymmetricKey);
        const symmetricKey = await this.crypto.decryptSymmetricKey(encryptedSymmetricKeyBuffer, publicKey);
        
        // Decrypt message content
        const encryptedDataBuffer = this.base64ToArrayBuffer(payload.encryptedData);
        const ivBuffer = this.base64ToArrayBuffer(payload.iv);
        const decryptedMessage = await this.crypto.decryptMessage(
          encryptedDataBuffer, 
          ivBuffer, 
          symmetricKey
        );
        
        // Verify signature
        const signatureBuffer = this.base64ToArrayBuffer(payload.signature);
        const isValidSignature = await this.crypto.verifySignature(
          decryptedMessage, 
          signatureBuffer, 
          publicKey
        );
        
        if (isValidSignature) {
          console.log(`✅ Message decrypted successfully with group: ${matchingGroup.name}`);
          return {
            message: decryptedMessage,
            groupName: matchingGroup.name,
            groupId: matchingGroup.id,
            keyId: keyId,
            timestamp: payload.timestamp,
            algorithm: payload.algorithm,
            sender: payload.sender || 'Unknown'
          };
        } else {
          throw new Error('Invalid signature');
        }
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
    const textNodes = this.getTextNodes(document.body);
    
    for (const node of textNodes) {
      if (node.textContent.includes(this.messageTagPrefix)) {
        messages.push({
          node: node,
          text: node.textContent,
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
      const parent = node.parentNode;
      const textContent = node.textContent;
      
      // Find the encrypted part
      const encryptedStart = textContent.indexOf(this.messageTag);
      if (encryptedStart === -1) return;
      
      const beforeEncrypted = textContent.substring(0, encryptedStart);
      const afterEncrypted = textContent.substring(encryptedStart);
      
      // Find the end of the encrypted message (look for end of base64)
      const encryptedEnd = this.findEncryptedMessageEnd(afterEncrypted);
      const encryptedPart = afterEncrypted.substring(0, encryptedEnd);
      const afterPart = afterEncrypted.substring(encryptedEnd);
      
      // Create replacement content
      const replacement = document.createElement('span');
      replacement.className = 'asocial-decrypted-message';
      replacement.innerHTML = `
        <div class="asocial-message-header">
          <span class="asocial-tag">🔒 Decrypted Message</span>
          <button class="asocial-toggle" onclick="this.parentElement.parentElement.classList.toggle('show-encrypted')">
            Show Encrypted
          </button>
        </div>
        <div class="asocial-content">${this.escapeHtml(decryptedContent)}</div>
        <div class="asocial-encrypted" style="display: none;">${this.escapeHtml(encryptedPart)}</div>
      `;
      
      // Replace the node
      const newTextNode = document.createTextNode(beforeEncrypted);
      parent.insertBefore(newTextNode, node);
      parent.insertBefore(replacement, node);
      parent.insertBefore(document.createTextNode(afterPart), node);
      parent.removeChild(node);
      
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
