/**
 * Asocial Universal Content Script
 * Works on any platform with text inputs
 */

class AsocialUniversal {
  constructor() {
    console.log('Asocial Universal: Constructor called');
    this.selectedText = '';
    this.selectionRange = null;
    this.encrypting = false;
    this.originalElement = null; // Store the original element that had focus
    this.encryptedText = null; // Store the encrypted text for pasting
    this.init();
  }

  async init() {
    try {
      console.log('Asocial Universal: Initializing...');
      
      // Set up text selection detection
      this.setupTextSelectionDetection();
      
      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Set up message handling from background script
      this.setupMessageHandling();
      
      // Set up decryption detection
      this.setupDecryptionDetection();
      
      console.log('Asocial Universal: Initialized successfully');
    } catch (error) {
      console.error('Asocial Universal: Initialization failed:', error);
    }
  }

  /**
   * Set up text selection detection
   */
  setupTextSelectionDetection() {
    // Listen for text selection events
    document.addEventListener('mouseup', (e) => {
      this.handleTextSelection(e);
    });

    // Listen for keyboard selection
    document.addEventListener('keyup', (e) => {
      if (e.ctrlKey || e.metaKey) {
        this.handleTextSelection(e);
      }
    });
  }

  /**
   * Handle text selection events
   */
  handleTextSelection(event) {
    try {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      console.log('Asocial Universal: Selection event detected');
      console.log('Selected text:', selectedText);
      console.log('Selection rangeCount:', selection.rangeCount);
      console.log('Event target:', event.target);
      console.log('Is text input element:', this.isTextInputElement(event.target));
      
      // Don't clear selection if it's from our modal
      if (event.target.closest('#asocial-encryption-modal')) {
        console.log('Asocial Universal: Ignoring selection from modal');
        return;
      }
      
      if (selectedText && this.isTextInputElement(event.target)) {
        this.selectedText = selectedText;
        this.selectionRange = selection.getRangeAt(0);
        this.originalElement = event.target; // Store the original element
        console.log('Asocial Universal: Text selected and stored:', selectedText.substring(0, 50) + '...');
        console.log('Original element stored:', this.originalElement);
      } else if (selectedText) {
        // Even if target is not a text input, store the selection if it's in a text input area
        const textInput = event.target.closest('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
        if (textInput) {
          this.selectedText = selectedText;
          this.selectionRange = selection.getRangeAt(0);
          this.originalElement = textInput; // Store the original element
          console.log('Asocial Universal: Text selected in text input area:', selectedText.substring(0, 50) + '...');
          console.log('Original element stored:', this.originalElement);
        } else {
          // Only clear if we're not in the middle of encryption
          if (!this.encrypting) {
            this.selectedText = '';
            this.selectionRange = null;
            this.originalElement = null;
          }
        }
      } else {
        // Only clear if we're not in the middle of encryption
        if (!this.encrypting) {
          this.selectedText = '';
          this.selectionRange = null;
          this.originalElement = null;
        }
      }
    } catch (error) {
      console.error('Asocial Universal: Error handling text selection:', error);
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+E for encryption
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        console.log('Asocial Universal: Ctrl+Shift+E detected');
        
        // First, select all text in the current input field
        this.selectAllTextFirst();
        
        // Then show encryption modal
        setTimeout(() => {
          this.showEncryptionModal();
        }, 100);
      }
    });
  }

  /**
   * Set up message handling from background script
   */
  setupMessageHandling() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showEncryptionModal') {
        this.selectedText = message.selectedText || '';
        this.showEncryptionModal();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Set up decryption detection (like OLD version)
   */
  setupDecryptionDetection() {
    console.log('Asocial Universal: Setting up decryption detection');
    
    // Detect encrypted messages on page load (like OLD version)
    this.detectEncryptedMessages();
    
    // Set up mutation observer to detect new encrypted messages (like OLD version)
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });
      
      if (shouldCheck) {
        // Debounce the decryption check
        clearTimeout(this.decryptionTimeout);
        this.decryptionTimeout = setTimeout(() => {
          this.detectEncryptedMessages();
        }, 1000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check on scroll and load events (like OLD version)
    document.addEventListener('scroll', () => {
      clearTimeout(this.decryptionTimeout);
      this.decryptionTimeout = setTimeout(() => {
        this.detectEncryptedMessages();
      }, 500);
    });
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.detectEncryptedMessages();
      }, 1000);
    });
  }

  /**
   * Process text node for encrypted content
   */
  processTextNode(textNode) {
    // Skip text nodes inside input elements
    if (this.isTextInputElement(textNode.parentElement)) {
      return;
    }
    
    // Skip WhatsApp message input areas
    const parent = textNode.parentElement;
    if (parent && (
      parent.classList.contains('copyable-text') || 
      parent.classList.contains('selectable-text') ||
      parent.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }
    
    const text = textNode.textContent;
    
    // Improved detection logic (based on OLD working version)
    // Pattern 1: Encrypted message with magic code: [ASOCIAL MAGIC123] encrypted_content
    const encryptedPattern = /\[ASOCIAL\s+([A-Z0-9]+)\]\s+(.+)/;
    // Pattern 2: Already decrypted message: [ASOCIAL] decrypted_content
    const decryptedPattern = /^\[ASOCIAL\]\s/;
    
    // Simple detection like OLD version
    console.log('Asocial Universal: Checking text:', text.substring(0, 100) + '...');
    
    // Check if it contains ASOCIAL (like OLD version)
    if (!text.includes('[ASOCIAL')) {
      return;
    }
    
    console.log('Asocial Universal: Found ASOCIAL in text, processing...');
    
    // Extract the encrypted message (like OLD version)
    const match = text.match(/\[ASOCIAL\s+([A-Z0-9]+)\]\s+(.+)/);
    if (!match) {
      console.log('Asocial Universal: No valid encrypted message format found');
      return;
    }
    
    const magicCode = match[1];
    const encryptedData = match[2];
    
    console.log('Asocial Universal: Found encrypted message with magic code:', magicCode);
    console.log('Asocial Universal: Encrypted data length:', encryptedData.length);
    
    // Process the encrypted message
    this.decryptAndReplaceText(textNode, text);
  }

  /**
   * Process element node for encrypted content
   */
  processElementNode(element) {
    // Skip input elements
    if (this.isTextInputElement(element)) {
      return;
    }

    // Process text nodes within element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text in input elements
          if (this.isTextInputElement(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      this.processTextNode(textNode);
    }
  }

  /**
   * Detect and decrypt encrypted messages (like OLD version)
   */
  async detectEncryptedMessages() {
    try {
      console.log('Asocial Universal: Detecting encrypted messages...');
    
      // Find all text nodes that might contain encrypted messages
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('[ASOCIAL')) {
          // Skip text nodes inside input fields or contentEditable elements
          if (this.isTextInInputField(node)) {
            console.log('Asocial Universal: Skipping encrypted text in input field');
            continue;
          }
          textNodes.push(node);
        }
      }
      
      console.log('Found potential encrypted message nodes:', textNodes.length);
      
      for (const textNode of textNodes) {
        await this.processEncryptedMessage(textNode);
      }
    } catch (error) {
      console.error('Asocial Universal: Error detecting encrypted messages:', error);
    }
  }

  /**
   * Check if a text node is inside an input field or contentEditable element
   */
  isTextInInputField(textNode) {
    if (!textNode) return false;
    
    // Walk up the DOM tree to find if we're inside an input field
    let parent = textNode.parentNode;
    while (parent && parent !== document.body) {
      if (this.isTextInputElement(parent)) {
        return true;
      }
      parent = parent.parentNode;
    }
    
    return false;
  }

  /**
   * Process a single encrypted message (like OLD version)
   */
  async processEncryptedMessage(textNode) {
    try {
      const text = textNode.textContent;
      console.log('Processing text node:', text.substring(0, 100) + '...');
      
      // Check if already processed to prevent loops
      if (textNode.parentElement && textNode.parentElement.dataset.asocialProcessed === 'true') {
        console.log('Asocial Universal: Text already processed, skipping');
        return;
      }
      
      // Check if this is an encrypted message
      if (!text.includes('[ASOCIAL')) {
        return;
      }
      
      // Skip if it's already been processed (contains [ASOCIAL ENCRYPTED] or [ASOCIAL] without magic code)
      if (text.includes('[ASOCIAL ENCRYPTED]') || (text.includes('[ASOCIAL]') && !text.match(/\[ASOCIAL\s+[A-Z0-9]+\]/))) {
        console.log('Asocial Universal: Message already processed, skipping');
        return;
      }
      
      // Extract the encrypted message
      const match = text.match(/\[ASOCIAL\s+([A-Z0-9]+)\]\s+(.+)/);
      if (!match) {
        console.log('No valid encrypted message format found');
        return;
      }
      
      const keyId = match[1];
      const encryptedData = match[2];
      
      console.log('Found encrypted message with key ID:', keyId);
      
      // Try to decrypt using background worker
      const result = await chrome.runtime.sendMessage({
        action: 'decryptMessage',
        magicCode: keyId,
        encryptedPayload: encryptedData
      });
      
      if (result.success) {
        console.log('Message decrypted successfully:', result.decryptedMessage);
        this.replaceEncryptedMessage(textNode, result.decryptedMessage, text);
      } else {
        console.log('Could not decrypt message:', result.error);
        this.showEncryptedMessage(textNode, text);
      }
    } catch (error) {
      console.error('Asocial Universal: Error processing encrypted message:', error);
    }
  }

  /**
   * Replace encrypted message with decrypted content (like OLD version)
   */
  replaceEncryptedMessage(textNode, decryptedMessage, originalText) {
    try {
      // Simply replace the text content without changing DOM structure
      const newText = `[ASOCIAL] ${decryptedMessage}`;
      textNode.textContent = newText;
      
      // Apply styling to the parent element if it exists - ONLY colors
      if (textNode.parentElement) {
        textNode.parentElement.style.backgroundColor = '#000000';
        textNode.parentElement.style.color = '#00FF00'; // Lime green
      }
      
      console.log('Asocial Universal: Message replaced with styled decrypted text');
    } catch (error) {
      console.error('Asocial Universal: Error replacing encrypted message:', error);
    }
  }

  /**
   * Show encrypted message (when decryption fails) (like OLD version)
   */
  showEncryptedMessage(textNode, originalText) {
    try {
      // Extract magic code for better error message
      const match = originalText.match(/\[ASOCIAL\s+([A-Z0-9]+)\]\s*(.+)/);
      const magicCode = match ? match[1] : 'UNKNOWN';
      
      // Replace the entire encrypted message with a simple indicator
      // This prevents the infinite loop by removing the original encrypted content
      const newText = `[ASOCIAL ENCRYPTED] (No decryption key available for magic: ${magicCode})`;
      textNode.textContent = newText;
      
      // Mark as processed to prevent further attempts
      if (textNode.parentElement) {
        textNode.parentElement.dataset.asocialProcessed = 'true';
      }
      
      console.log('Asocial Universal: Message marked as encrypted and processed to prevent loops');
    } catch (error) {
      console.error('Asocial Universal: Error showing encrypted message:', error);
    }
  }

  /**
   * Decrypt and replace text content
   */
  async decryptAndReplaceText(textNode, originalText) {
    try {
      console.log('Asocial Universal: Attempting to decrypt text');
      console.log('Asocial Universal: Original text:', originalText.substring(0, 100) + '...');
      
      // Check if already processed to prevent loops
      if (textNode.parentElement && textNode.parentElement.dataset.asocialProcessed === 'true') {
        console.log('Asocial Universal: Text already processed, skipping');
        return;
      }
      
      // Additional check: if the text already contains decrypted pattern, skip
      if (originalText.includes('[ASOCIAL] ') && !originalText.includes('[ASOCIAL ')) {
        console.log('Asocial Universal: Text appears to be already decrypted, skipping');
        return;
      }
      
      // Extract magic code and encrypted content
      const match = originalText.match(/\[ASOCIAL\s+([A-Z0-9]+)\]\s*(.+)/);
      console.log('Asocial Universal: Match result:', match);
      if (!match) {
        console.log('Asocial Universal: No match found');
        return;
      }

      const magicCode = match[1];
      const encryptedContent = match[2];
      console.log('Asocial Universal: Magic code:', magicCode);
      console.log('Asocial Universal: Encrypted content length:', encryptedContent.length);

      // Check if we've already tried to decrypt this magic code recently
      const failedMagicCodes = this.getFailedMagicCodes();
      if (failedMagicCodes.includes(magicCode)) {
        console.log('Asocial Universal: Magic code already failed recently, skipping:', magicCode);
        // Mark as processed to prevent further attempts
        if (textNode.parentElement) {
          textNode.parentElement.dataset.asocialProcessed = 'true';
        }
        // Leave the encrypted message as-is, don't modify it
        console.log('Asocial Universal: Leaving encrypted message unchanged - magic code previously failed');
        return;
      }

      // Request decryption from background worker
      console.log('Asocial Universal: Sending decryption request to background worker');
      console.log('Asocial Universal: Magic code:', magicCode);
      console.log('Asocial Universal: Encrypted content length:', encryptedContent.length);
      
      const result = await chrome.runtime.sendMessage({
        action: 'decryptMessage',
        magicCode: magicCode,
        encryptedPayload: encryptedContent
      });
      
      console.log('Asocial Universal: Received decryption result:', result);

      if (result.success) {
        // Mark as processed to prevent loops
        if (textNode.parentElement) {
          textNode.parentElement.dataset.asocialProcessed = 'true';
        }
        
        // Replace text content in place
        const decryptedText = `[ASOCIAL] ${result.decryptedMessage}`;
        textNode.textContent = originalText.replace(
          /\[ASOCIAL\s+[A-Z0-9]{7}\]\s*.+/,
          decryptedText
        );
        
        // Add styling to the parent element if possible
        this.addDecryptedStyling(textNode);
        
        console.log('Asocial Universal: Text decrypted and replaced');
      } else {
        console.log('Asocial Universal: Failed to decrypt text:', result.error);
        
        // Track failed magic codes to prevent repeated attempts
        this.trackFailedMagicCode(magicCode);
        
        // Mark as processed to prevent loops
        if (textNode.parentElement) {
          textNode.parentElement.dataset.asocialProcessed = 'true';
        }
        
        // Just leave the encrypted message as-is, don't modify it
        console.log('Asocial Universal: Leaving encrypted message unchanged - no suitable decryption key found');
      }
    } catch (error) {
      console.error('Asocial Universal: Error decrypting text:', error);
      
      // Mark as processed to prevent loops even on error
      if (textNode.parentElement) {
        textNode.parentElement.dataset.asocialProcessed = 'true';
      }
    }
  }

  /**
   * Add styling to decrypted text
   */
  addDecryptedStyling(textNode) {
    try {
      // Gently modify parent element colors only
      const parent = textNode.parentElement;
      if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
        parent.style.backgroundColor = '#000000';
        parent.style.color = '#00ff00';
        console.log('Asocial Universal: Applied decrypted styling to parent element');
      }
    } catch (error) {
      console.error('Asocial Universal: Error applying decrypted styling:', error);
    }
  }

  /**
   * Add styling to encrypted text
   */
  addEncryptedStyling(textNode) {
    try {
      // Gently modify parent element colors only
      const parent = textNode.parentElement;
      if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
        parent.style.backgroundColor = '#000000';
        parent.style.color = '#00ff00';
        console.log('Asocial Universal: Applied encrypted styling to parent element');
      }
    } catch (error) {
      console.error('Asocial Universal: Error adding encrypted styling:', error);
    }
  }

  /**
   * Show encryption modal
   */
  async showEncryptionModal() {
    console.log('Asocial Universal: Showing encryption modal');
    console.log('Current selectedText:', this.selectedText);
    console.log('Current selection:', window.getSelection().toString());
    
    // If no stored text, try to get current selection
    if (!this.selectedText) {
      const currentSelection = window.getSelection().toString().trim();
      if (currentSelection) {
        this.selectedText = currentSelection;
        console.log('Asocial Universal: Using current selection as selectedText:', currentSelection);
      } else {
        this.showNotification('Please select some text to encrypt', 'error');
        return;
      }
    }

    try {
      // Get available writer keys
      const writerKeys = await this.getWriterKeys();
      
      if (writerKeys.length === 0) {
        this.showNotification('No writer keys found. Please open the extension popup, create a KeyStore, and add writer keys first.', 'error');
        return;
      }

      // Show encryption modal
      this.createEncryptionModal(writerKeys);
    } catch (error) {
      console.error('Asocial Universal: Error showing encryption modal:', error);
      this.showNotification('Failed to load encryption keys', 'error');
    }
  }

  /**
   * Get available writer keys from background worker
   */
  async getWriterKeys() {
    try {
      console.log('Asocial Universal: Getting writer keys from background worker');
      
      // Use persistent connection to keep service worker alive
      const port = chrome.runtime.connect({ name: 'content-port' });
      console.log('Asocial Universal: Connected to background worker');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          port.disconnect();
          console.log('Asocial Universal: No writer keys available (timeout)');
          resolve([]);
        }, 5000);
        
        port.onMessage.addListener((response) => {
          clearTimeout(timeout);
          port.disconnect();
          
          console.log('=== CONTENT SCRIPT RECEIVED FROM WORKER ===');
          console.log('Asocial Universal: Full response object:', response);
          console.log('Asocial Universal: Response type:', typeof response);
          console.log('Asocial Universal: Response is array:', Array.isArray(response));
          console.log('Asocial Universal: Response length:', response?.length);
          
          if (Array.isArray(response) && response.length > 0) {
            console.log('Asocial Universal: Retrieved writer keys:', response.length);
            console.log('Asocial Universal: First writer key received:', response[0]);
            console.log('Asocial Universal: First writer key fields:', Object.keys(response[0]));
            console.log('Asocial Universal: First writer key has publicKey:', 'publicKey' in response[0]);
            console.log('Asocial Universal: First writer key has privateKey:', 'privateKey' in response[0]);
            console.log('=== END CONTENT SCRIPT RECEIVED ===');
            
            resolve(response.map(key => ({
              ...key,
              storageName: 'Active KeyStore' // Background worker manages the active KeyStore
            })));
          } else {
            console.log('Asocial Universal: No writer keys available');
            console.log('=== END CONTENT SCRIPT RECEIVED ===');
            resolve([]);
          }
        });
        
        // Send request to background worker
        const request = { action: 'getWriterKeys' };
        console.log('=== CONTENT SCRIPT SENDING TO WORKER ===');
        console.log('Asocial Universal: Sending request:', request);
        console.log('Asocial Universal: Request type:', typeof request);
        console.log('Asocial Universal: Request action:', request.action);
        console.log('=== END CONTENT SCRIPT SENDING ===');
        
        port.postMessage(request);
      });
    } catch (error) {
      console.error('Asocial Universal: Error getting writer keys:', error);
      return [];
    }
  }

  /**
   * Create encryption modal
   */
  createEncryptionModal(writerKeys) {
    // Remove existing modal if any
    const existingModal = document.getElementById('asocial-encryption-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'asocial-encryption-modal';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #000000; border: 2px solid #00ff00; border-radius: 8px;
      padding: 24px; max-width: 800px; width: 90%;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    `;

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #00ff00; font-weight: bold;">Encrypt Selected Text</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; color: #00ff00; margin-bottom: 8px; font-weight: 600;">Selected text:</label>
        <div style="
          padding: 12px; border: 1px solid #00ff00; border-radius: 4px;
          background: #000000; color: #00ff00; max-height: 100px; overflow-y: auto;
          font-size: 14px; white-space: pre-wrap;
        ">${this.selectedText}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; color: #00ff00; margin-bottom: 8px; font-weight: 600;">Select encryption key:</label>
        <div id="asocial-key-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #00ff00; border-radius: 4px; background: #000000;">
          <!-- Keys will be loaded here -->
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="asocial-encrypt-cancel" style="
          background: #000000; color: #00ff00; border: 1px solid #00ff00;
          border-radius: 4px; padding: 10px 20px; cursor: pointer;
        ">Cancel</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Populate key list
    this.populateKeyList(writerKeys);

    // Set up event listeners
    this.setupModalEventListeners(overlay);
  }

  /**
   * Populate key list in modal
   */
  populateKeyList(writerKeys) {
    const keyList = document.getElementById('asocial-key-list');
    
    writerKeys.forEach(key => {
      const item = document.createElement('div');
      item.className = 'asocial-key-item';
      item.setAttribute('data-key-id', key.id);
      item.style.cssText = `
        padding: 8px 12px; border-bottom: 1px solid #00ff00; cursor: pointer;
        transition: background-color 0.2s; background: #000000; color: #00ff00;
        font-size: 14px;
      `;
      item.innerHTML = `
        <div style="font-weight: 600; color: #00ff00; margin-bottom: 2px;">${key.name}</div>
        <div style="font-size: 12px; color: #00ff00; opacity: 0.8;">Storage: ${key.storageName || 'Unknown'}</div>
      `;
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#001100';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '#000000';
      });
      
      keyList.appendChild(item);
    });
  }

  /**
   * Set up modal event listeners
   */
  setupModalEventListeners(overlay) {
    // Key selection
    document.getElementById('asocial-key-list').addEventListener('click', async (e) => {
      const keyItem = e.target.closest('.asocial-key-item');
      if (keyItem) {
        const keyId = keyItem.getAttribute('data-key-id');
        await this.encryptWithKey(keyId);
        overlay.remove();
      }
    });

    // Cancel button
    document.getElementById('asocial-encrypt-cancel').addEventListener('click', () => {
      overlay.remove();
    });

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Encrypt text with selected key
   */
  async encryptWithKey(keyId) {
    try {
      this.encrypting = true;
      console.log('Asocial Universal: Encrypting with key:', keyId);
      
      // Use persistent connection to keep service worker alive
      const port = chrome.runtime.connect({ name: 'content-port' });
      
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          port.disconnect();
          resolve({ success: false, error: 'Encryption timeout' });
        }, 10000);
        
        port.onMessage.addListener((response) => {
          clearTimeout(timeout);
          port.disconnect();
          
          console.log('=== CONTENT SCRIPT RECEIVED ENCRYPTION RESULT ===');
          console.log('Asocial Universal: Encryption result:', response);
          console.log('Asocial Universal: Result success:', response.success);
          console.log('Asocial Universal: Result error:', response.error);
          console.log('Asocial Universal: Result encryptedMessage length:', response.encryptedMessage?.length);
          console.log('=== END CONTENT SCRIPT RECEIVED ENCRYPTION ===');
          
          resolve(response);
        });
        
        // Send encryption request to background worker
        const request = {
          action: 'encryptMessage',
          text: this.selectedText,
          writerKeyId: keyId
        };
        
        console.log('=== CONTENT SCRIPT SENDING ENCRYPTION REQUEST ===');
        console.log('Asocial Universal: Sending encryption request:', request);
        console.log('Asocial Universal: - Action:', request.action);
        console.log('Asocial Universal: - Text:', request.text);
        console.log('Asocial Universal: - Text length:', request.text?.length);
        console.log('Asocial Universal: - Writer Key ID:', request.writerKeyId);
        console.log('=== END CONTENT SCRIPT SENDING ENCRYPTION ===');
        
        port.postMessage(request);
      });
      
      if (result.success) {
        console.log('Asocial Universal: Message encrypted successfully');
        // Replace the selected text with encrypted version
        this.replaceSelectedText(result.encryptedMessage);
        this.showNotification('Text encrypted successfully!', 'success');
      } else {
        console.error('Asocial Universal: Encryption failed:', result.error);
        this.showNotification('Encryption failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Asocial Universal: Error encrypting text:', error);
      this.showNotification('Encryption failed: ' + error.message, 'error');
    } finally {
      this.encrypting = false;
    }
  }

  /**
   * Replace selected text with encrypted version - CLIPBOARD + AUTO PASTE
   */
  replaceSelectedText(encryptedText) {
    try {
      console.log('Asocial Universal: Copying encrypted text to clipboard');
      console.log('Encrypted text:', encryptedText.substring(0, 100) + '...');
      
      // Store the encrypted text for pasting
      this.encryptedText = encryptedText;
      
      // Copy to clipboard and then auto-paste
      this.copyToClipboardAndPaste(encryptedText);
      
    } catch (error) {
      console.error('Asocial Universal: Error copying to clipboard:', error);
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Copy text to clipboard and auto-paste
   */
  copyToClipboardAndPaste(text) {
    try {
      // Method 1: Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          console.log('Clipboard API: Text copied successfully');
          // Auto-paste after copying
          this.autoPasteText();
        }).catch(error => {
          console.log('Clipboard API failed, trying fallback:', error);
          this.copyToClipboardFallbackAndPaste(text);
        });
      } else {
        console.log('Clipboard API not available, using fallback');
        this.copyToClipboardFallbackAndPaste(text);
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      this.copyToClipboardFallbackAndPaste(text);
    }
  }

  /**
   * Copy text to clipboard using multiple methods (legacy method)
   */
  copyToClipboard(text) {
    try {
      // Method 1: Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.selectAllText();
          this.showNotification('🔒 Encrypted text copied to clipboard! Paste it manually (Ctrl+V)', 'success');
          console.log('Clipboard API: Text copied successfully');
        }).catch(error => {
          console.log('Clipboard API failed, trying fallback:', error);
          this.copyToClipboardFallback(text);
        });
      } else {
        console.log('Clipboard API not available, using fallback');
        this.copyToClipboardFallback(text);
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      this.copyToClipboardFallback(text);
    }
  }

  /**
   * Fallback clipboard method using execCommand with auto-paste
   */
  copyToClipboardFallbackAndPaste(text) {
    try {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.focus();
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        console.log('execCommand: Text copied successfully');
        // Auto-paste after copying
        this.autoPasteText();
      } else {
        this.showNotification('Failed to copy to clipboard', 'error');
        console.log('execCommand: Copy failed');
      }
    } catch (error) {
      console.error('Fallback clipboard copy failed:', error);
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Fallback clipboard method using execCommand (legacy method)
   */
  copyToClipboardFallback(text) {
    try {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.focus();
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        this.selectAllText();
        this.showNotification('🔒 Encrypted text copied to clipboard! Paste it manually (Ctrl+V)', 'success');
        console.log('execCommand: Text copied successfully');
      } else {
        this.showNotification('Failed to copy to clipboard', 'error');
        console.log('execCommand: Copy failed');
      }
    } catch (error) {
      console.error('Fallback clipboard copy failed:', error);
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Auto-paste the encrypted text into the original element
   */
  autoPasteText() {
    try {
      console.log('Asocial Universal: Auto-pasting encrypted text');
      
      // Use the original element where the user selected text
      let targetElement = this.originalElement;
      
      if (!targetElement) {
        // Fallback to active element or last text input
        const activeElement = document.activeElement;
        if (activeElement && this.isTextInputElement(activeElement)) {
          targetElement = activeElement;
        } else {
          const textInputs = document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
          if (textInputs.length > 0) {
            targetElement = textInputs[textInputs.length - 1];
          }
        }
      }
      
      if (targetElement) {
        console.log('Asocial Universal: Auto-pasting into element:', targetElement);
        
        // Focus the target element
        targetElement.focus();
        
        // Small delay to ensure focus, then select all and paste
        setTimeout(() => {
          console.log('Asocial Universal: Selecting all text for auto-paste');
          
          if (targetElement.contentEditable === 'true') {
            // For contentEditable, use range selection
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(targetElement);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('Asocial Universal: ContentEditable text selected for auto-paste');
          } else {
            // For regular inputs, use select()
            targetElement.select();
            console.log('Asocial Universal: Input text selected for auto-paste');
          }
          
          // After selecting text, try to paste the content
          setTimeout(() => {
            console.log('Asocial Universal: Attempting to paste encrypted text');
            
            // Method 1: Try execCommand paste
            const pasteSuccess = document.execCommand('paste', false, null);
            console.log('Asocial Universal: execCommand paste result:', pasteSuccess);
            
            // Method 2: If paste didn't work, try execCommand insertText
            let insertSuccess = false;
            if (!pasteSuccess) {
              console.log('Asocial Universal: Paste failed, trying insertText');
              insertSuccess = document.execCommand('insertText', false, this.encryptedText || '');
              console.log('Asocial Universal: execCommand insertText result:', insertSuccess);
            }
            
            // Method 3: Direct text insertion as fallback
            if (!pasteSuccess && !insertSuccess) {
              console.log('Asocial Universal: Both paste methods failed, using direct insertion');
              if (targetElement.contentEditable === 'true') {
                targetElement.textContent = this.encryptedText || '';
              } else {
                targetElement.value = this.encryptedText || '';
              }
              
              // Trigger input event
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              targetElement.dispatchEvent(inputEvent);
              console.log('Asocial Universal: Direct text insertion completed');
            }
            
            console.log('Asocial Universal: Paste attempt completed');
            this.showNotification('🔒 Text encrypted and pasted automatically!', 'success');
          }, 200); // Wait a bit longer for selection to complete
        }, 50);
      } else {
        console.log('Asocial Universal: No target element found for auto-paste');
        this.showNotification('🔒 Encrypted text copied! Paste manually (Ctrl+V)', 'success');
      }
    } catch (error) {
      console.error('Asocial Universal: Error auto-pasting text:', error);
      this.showNotification('🔒 Encrypted text copied! Paste manually (Ctrl+V)', 'success');
    }
  }

  /**
   * Select all text in the current input field (for keyboard shortcut)
   */
  selectAllTextFirst() {
    try {
      // Find the currently focused element or the last text input
      const activeElement = document.activeElement;
      let targetElement = null;
      
      if (activeElement && this.isTextInputElement(activeElement)) {
        targetElement = activeElement;
      } else {
        // Find the last text input on the page
        const textInputs = document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
        if (textInputs.length > 0) {
          targetElement = textInputs[textInputs.length - 1];
        }
      }
      
      if (targetElement) {
        console.log('Selecting all text in current input:', targetElement);
        
        // Focus the element first
        targetElement.focus();
        
        // Select all text immediately
        if (targetElement.contentEditable === 'true') {
          // For contentEditable, use range selection
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(targetElement);
          selection.removeAllRanges();
          selection.addRange(range);
          console.log('ContentEditable text selected');
        } else {
          // For regular inputs, use select()
          targetElement.select();
          console.log('Input text selected');
        }
        
        // Store the selected text
        this.selectedText = targetElement.value || targetElement.textContent || '';
        this.originalElement = targetElement;
        console.log('Selected text stored:', this.selectedText.substring(0, 50) + '...');
      } else {
        console.log('No text input found for selection');
      }
    } catch (error) {
      console.error('Asocial Universal: Error selecting all text:', error);
    }
  }

  /**
   * Select all text in the original element (for pasting)
   */
  selectAllText() {
    try {
      // Use the original element where the user selected text
      let targetElement = this.originalElement;
      
      if (!targetElement) {
        // Fallback to active element or last text input
        const activeElement = document.activeElement;
        if (activeElement && this.isTextInputElement(activeElement)) {
          targetElement = activeElement;
        } else {
          const textInputs = document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
          if (textInputs.length > 0) {
            targetElement = textInputs[textInputs.length - 1];
          }
        }
      }
      
      if (targetElement) {
        console.log('Selecting all text in original element:', targetElement);
        
        // Focus the original element
        targetElement.focus();
        
        // Small delay to ensure focus, then select all text
        setTimeout(() => {
          console.log('Attempting to select all text in:', targetElement);
          console.log('Element type:', targetElement.tagName);
          console.log('ContentEditable:', targetElement.contentEditable);
          
          if (targetElement.contentEditable === 'true') {
            // For contentEditable, use range selection
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(targetElement);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('ContentEditable text selected for pasting');
          } else {
            // For regular inputs, use select()
            targetElement.select();
            console.log('Input text selected for pasting');
          }
        }, 50);
      } else {
        console.log('No target element found for text selection');
      }
    } catch (error) {
      console.error('Asocial Universal: Error selecting all text for pasting:', error);
    }
  }

  /**
   * Check if element is a text input
   */
  isTextInputElement(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const inputType = element.type ? element.type.toLowerCase() : '';
    const contentEditable = element.contentEditable === 'true';
    
    return (
      tagName === 'textarea' ||
      (tagName === 'input' && ['text', 'email', 'search', 'url'].includes(inputType)) ||
      contentEditable
    );
  }

  /**
   * Track failed magic codes to prevent repeated decryption attempts
   */
  trackFailedMagicCode(magicCode) {
    try {
      const failedCodes = this.getFailedMagicCodes();
      if (!failedCodes.includes(magicCode)) {
        failedCodes.push(magicCode);
        // Store for 5 minutes to prevent repeated attempts
        localStorage.setItem('asocial_failed_magic_codes', JSON.stringify({
          codes: failedCodes,
          timestamp: Date.now()
        }));
        console.log('Asocial Universal: Tracked failed magic code:', magicCode);
      }
    } catch (error) {
      console.error('Asocial Universal: Error tracking failed magic code:', error);
    }
  }

  /**
   * Get list of recently failed magic codes
   */
  getFailedMagicCodes() {
    try {
      const stored = localStorage.getItem('asocial_failed_magic_codes');
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      // Clean up old entries
      if (data.timestamp < fiveMinutesAgo) {
        localStorage.removeItem('asocial_failed_magic_codes');
        return [];
      }
      
      return data.codes || [];
    } catch (error) {
      console.error('Asocial Universal: Error getting failed magic codes:', error);
      return [];
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.getElementById('asocial-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'asocial-notification';
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #000000; border: 2px solid #00ff00; border-radius: 8px;
      padding: 12px 20px; color: #00ff00; font-size: 14px;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
      max-width: 300px; word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize when DOM is ready (like OLD version)
console.log('=== ASOCIAL CONTENT SCRIPT STARTING ===');
console.log('Asocial Universal: Document ready state:', document.readyState);
console.log('Asocial Universal: Current URL:', window.location.href);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Asocial Universal: DOMContentLoaded - initializing');
    new AsocialUniversal();
  });
} else {
  console.log('Asocial Universal: DOM already ready - initializing immediately');
  new AsocialUniversal();
}
