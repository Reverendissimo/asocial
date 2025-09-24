/**
 * Universal Asocial Content Script
 * Works on any platform with text inputs
 */

class AsocialUniversal {
  constructor() {
    this.selectedText = '';
    this.selectionRange = null;
    this.encryptionEngine = null;
    this.keyManager = null;
    this.encrypting = false;
    this.init();
  }

  async init() {
    try {
      console.log('Asocial Universal: Initializing...');
      
      // Initialize encryption engine and key manager
      this.encryptionEngine = new AsocialEncryptionEngine();
      this.keyManager = new AsocialKeyManager();
      
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
        console.log('Asocial Universal: Text selected and stored:', selectedText.substring(0, 50) + '...');
      } else if (selectedText) {
        // Even if target is not a text input, store the selection if it's in a text input area
        const textInput = event.target.closest('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
        if (textInput) {
          this.selectedText = selectedText;
          this.selectionRange = selection.getRangeAt(0);
          console.log('Asocial Universal: Text selected in text input area:', selectedText.substring(0, 50) + '...');
        } else {
          // Only clear if we're not in the middle of encryption
          if (!this.encrypting) {
            this.selectedText = '';
            this.selectionRange = null;
          }
        }
      } else {
        // Only clear if we're not in the middle of encryption
        if (!this.encrypting) {
          this.selectedText = '';
          this.selectionRange = null;
        }
      }
    } catch (error) {
      console.error('Asocial Universal: Error handling text selection:', error);
    }
  }

  /**
   * Check if element is a text input
   */
  isTextInputElement(element) {
    if (!element) return false;
    
    // Check for text input types
    if (element.tagName === 'TEXTAREA') return true;
    if (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type)) return true;
    if (element.contentEditable === 'true') return true;
    
    // Check if element is inside a text input
    const textInput = element.closest('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
    return textInput !== null;
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
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+E for encryption
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.showEncryptionModal();
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
        this.showNotification('No writer keys found. Please create one in the extension popup.', 'error');
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
   * Get available writer keys
   */
  async getWriterKeys() {
    try {
      const result = await chrome.storage.local.get(['asocial_temp_storage']);
      const tempStorage = result.asocial_temp_storage;
      
      if (!tempStorage || !tempStorage.writerKeys) {
        return [];
      }

      return tempStorage.writerKeys.map(key => ({
        ...key,
        storageName: tempStorage.storageName || 'Unknown'
      }));
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
      padding: 24px; max-width: 500px; width: 90%;
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
      
      // Get the writer key
      const writerKeys = await this.getWriterKeys();
      const selectedKey = writerKeys.find(key => key.id === keyId);
      
      if (!selectedKey) {
        this.showNotification('Selected key not found', 'error');
        return;
      }

      // Encrypt the text
      const encryptedMessage = await this.encryptionEngine.encryptMessage(this.selectedText, selectedKey);
      
      if (!encryptedMessage) {
        this.showNotification('Encryption failed', 'error');
        return;
      }

      // Replace the selected text
      this.replaceSelectedText(encryptedMessage);
      
      this.showNotification('Text encrypted successfully!', 'success');
    } catch (error) {
      console.error('Asocial Universal: Error encrypting text:', error);
      this.showNotification('Encryption failed: ' + error.message, 'error');
    } finally {
      this.encrypting = false;
    }
  }

  /**
   * Replace selected text with encrypted version
   */
  replaceSelectedText(encryptedText) {
    try {
      console.log('Asocial Universal: Replacing text with encrypted version');
      console.log('Encrypted text:', encryptedText.substring(0, 100) + '...');
      console.log('Original selected text:', this.selectedText);
      
      // Get current selection
      const selection = window.getSelection();
      console.log('Current selection rangeCount:', selection.rangeCount);
      console.log('Stored selectionRange:', this.selectionRange);
      console.log('Current selection text:', selection.toString());
      
      // Check if current selection is targeting the modal (wrong target)
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        
        // Check if containers are text nodes from the modal
        const isModalText = (startContainer.nodeType === Node.TEXT_NODE && 
                           (startContainer.textContent.includes('Storage:') || 
                            startContainer.textContent.includes('Linkedin-common'))) ||
                          (endContainer.nodeType === Node.TEXT_NODE && 
                           (endContainer.textContent.includes('Storage:') || 
                            endContainer.textContent.includes('Linkedin-common')));
        
        console.log('Is targeting modal text:', isModalText);
        console.log('Start container text:', startContainer.textContent);
        console.log('End container text:', endContainer.textContent);
        
        if (isModalText) {
          console.log('Current selection is targeting modal, using fallback method');
          this.replaceTextInInput(encryptedText);
          return;
        }
      }
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        console.log('Using current selection range');
        console.log('Range start container:', range.startContainer);
        console.log('Range end container:', range.endContainer);
        console.log('Range start offset:', range.startOffset);
        console.log('Range end offset:', range.endOffset);
        
        // Check if range is valid
        if (range.startContainer && range.endContainer) {
          // Delete the selected content
          range.deleteContents();
          console.log('Deleted contents from range');
          
          // Insert the encrypted text
          const textNode = document.createTextNode(encryptedText);
          range.insertNode(textNode);
          console.log('Inserted encrypted text node');
          
          // Clear selection
          selection.removeAllRanges();
          
          console.log('Asocial Universal: Text replaced successfully with current selection');
        } else {
          console.log('Range is invalid, using fallback');
          this.replaceTextInInput(encryptedText);
        }
      } else if (this.selectionRange) {
        console.log('Using stored selection range');
        console.log('Stored range start container:', this.selectionRange.startContainer);
        console.log('Stored range end container:', this.selectionRange.endContainer);
        
        // Check if stored range is valid
        if (this.selectionRange.startContainer && this.selectionRange.endContainer) {
          // Fallback to stored range
          this.selectionRange.deleteContents();
          const textNode = document.createTextNode(encryptedText);
          this.selectionRange.insertNode(textNode);
          window.getSelection().removeAllRanges();
          console.log('Asocial Universal: Text replaced using stored range');
        } else {
          console.log('Stored range is invalid, using fallback');
          // Try LinkedIn chat-specific replacement first
          if (this.replaceTextInLinkedInChat(encryptedText)) {
            console.log('LinkedIn chat replacement successful');
            this.showNotification('Text replaced successfully!', 'success');
          } else {
            // Fallback to general input replacement
            this.replaceTextInInput(encryptedText);
          }
        }
      } else {
        console.log('No selection found, using fallback method');
        // Try LinkedIn chat-specific replacement first
        if (this.replaceTextInLinkedInChat(encryptedText)) {
          console.log('LinkedIn chat replacement successful');
          this.showNotification('Text replaced successfully!', 'success');
        } else {
          // Fallback to general input replacement
          this.replaceTextInInput(encryptedText);
        }
      }
    } catch (error) {
      console.error('Asocial Universal: Error replacing text:', error);
      this.showNotification('Failed to replace text', 'error');
    }
  }
  
  /**
   * LinkedIn-specific text replacement for chat inputs
   */
  replaceTextInLinkedInChat(encryptedText) {
    try {
      console.log('Asocial Universal: LinkedIn chat-specific replacement');
      
      // Find LinkedIn chat input specifically
      const chatInputs = document.querySelectorAll('[data-test-id="msg-form-input"], [data-test-id="msg-form-text-input"], .msg-form__contenteditable, .msg-form__text-input');
      console.log('Found LinkedIn chat inputs:', chatInputs.length);
      
      for (const input of chatInputs) {
        console.log('Processing LinkedIn chat input:', input);
        
        if (input.contentEditable === 'true') {
          // Clear and set content
          input.innerHTML = '';
          input.textContent = encryptedText;
        } else {
          input.value = encryptedText;
        }
        
        // Trigger LinkedIn-specific events
        const events = [
          new Event('input', { bubbles: true, cancelable: true }),
          new Event('change', { bubbles: true, cancelable: true }),
          new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }),
          new KeyboardEvent('keyup', { key: 'a', bubbles: true, cancelable: true }),
          new ClipboardEvent('paste', { bubbles: true, cancelable: true }),
          new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }),
          new CompositionEvent('compositionend', { bubbles: true, cancelable: true })
        ];
        
        events.forEach(event => {
          input.dispatchEvent(event);
        });
        
        // Force focus and additional events
        input.focus();
        input.blur();
        input.focus();
        
        console.log('LinkedIn chat input processed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Asocial Universal: Error in LinkedIn chat replacement:', error);
      return false;
    }
  }

  /**
   * Fallback method to replace text in input element
   */
  replaceTextInInput(encryptedText) {
    try {
      console.log('Asocial Universal: Using fallback text replacement');
      console.log('Looking for input element to replace text in...');
      console.log('Original selected text:', this.selectedText);
      
      // First, try to find the input that contains the original selected text
      const textInputs = document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="search"], input[type="url"], [contenteditable="true"]');
      console.log('Found text inputs on page:', textInputs.length);
      
      let targetInput = null;
      
      // Look for input that contains the selected text
      for (const input of textInputs) {
        let inputText = '';
        if (input.contentEditable === 'true') {
          inputText = input.textContent || input.innerText || '';
        } else {
          inputText = input.value || '';
        }
        
        console.log('Checking input:', input, 'Text:', inputText);
        
        if (inputText.includes(this.selectedText)) {
          targetInput = input;
          console.log('Found input containing selected text:', input);
          break;
        }
      }
      
      // If not found, use the active element
      if (!targetInput) {
        const activeElement = document.activeElement;
        console.log('Active element:', activeElement);
        console.log('Active element tag:', activeElement?.tagName);
        console.log('Active element contentEditable:', activeElement?.contentEditable);
        
        if (activeElement && this.isTextInputElement(activeElement)) {
          targetInput = activeElement;
          console.log('Using active element as target');
        }
      }
      
      // If still not found, use the last text input
      if (!targetInput && textInputs.length > 0) {
        targetInput = textInputs[textInputs.length - 1];
        console.log('Using last text input as fallback:', targetInput);
      }
      
      if (targetInput) {
        console.log('Target input found:', targetInput);
        
        if (targetInput.contentEditable === 'true') {
          console.log('Replacing contentEditable text');
          // For contentEditable, replace the entire content
          targetInput.textContent = encryptedText;
        } else if (targetInput.tagName === 'TEXTAREA' || targetInput.tagName === 'INPUT') {
          console.log('Replacing textarea/input value');
          targetInput.value = encryptedText;
        }
        
        // Trigger comprehensive events to notify the platform (especially LinkedIn chat)
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        const keyupEvent = new KeyboardEvent('keyup', { bubbles: true, cancelable: true });
        const keydownEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
        const keypressEvent = new KeyboardEvent('keypress', { bubbles: true, cancelable: true });
        const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
        const compositionStartEvent = new CompositionEvent('compositionstart', { bubbles: true, cancelable: true });
        const compositionEndEvent = new CompositionEvent('compositionend', { bubbles: true, cancelable: true });
        const focusEvent = new FocusEvent('focus', { bubbles: true, cancelable: true });
        const blurEvent = new FocusEvent('blur', { bubbles: true, cancelable: true });
        
        // Trigger all events in sequence
        targetInput.dispatchEvent(focusEvent);
        targetInput.dispatchEvent(compositionStartEvent);
        targetInput.dispatchEvent(keydownEvent);
        targetInput.dispatchEvent(inputEvent);
        targetInput.dispatchEvent(changeEvent);
        targetInput.dispatchEvent(keypressEvent);
        targetInput.dispatchEvent(keyupEvent);
        targetInput.dispatchEvent(pasteEvent);
        targetInput.dispatchEvent(compositionEndEvent);
        targetInput.dispatchEvent(blurEvent);
        
        // Force focus back and trigger additional events
        setTimeout(() => {
          targetInput.focus();
          targetInput.dispatchEvent(inputEvent);
          targetInput.dispatchEvent(changeEvent);
        }, 100);
        
        console.log('Asocial Universal: Text replaced in input element');
        this.showNotification('Text replaced successfully!', 'success');
      } else {
        console.error('Asocial Universal: No suitable input element found');
        this.showNotification('Could not find input element to replace text', 'error');
      }
    } catch (error) {
      console.error('Asocial Universal: Error in fallback replacement:', error);
      this.showNotification('Failed to replace text', 'error');
    }
  }

  /**
   * Set up decryption detection
   */
  setupDecryptionDetection() {
    // Detect encrypted messages on page load
    this.detectEncryptedMessages();
    
    // Set up mutation observer to detect new encrypted messages
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
    
    // Also check on scroll and load events
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
   * Detect and decrypt encrypted messages
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
   * Process a single encrypted message
   */
  async processEncryptedMessage(textNode) {
    try {
      const text = textNode.textContent;
      console.log('Processing text node:', text.substring(0, 100) + '...');
      
      // Check if this is an encrypted message
      if (!text.includes('[ASOCIAL')) {
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
      
      // Try to decrypt
      const decryptionResult = await this.encryptionEngine.decryptMessage(text);
      
      if (decryptionResult && decryptionResult.message) {
        console.log('Message decrypted successfully:', decryptionResult.message);
        this.replaceEncryptedMessage(textNode, decryptionResult.message, text);
      } else {
        console.log('Could not decrypt message');
        this.showEncryptedMessage(textNode, text);
      }
    } catch (error) {
      console.error('Asocial Universal: Error processing encrypted message:', error);
    }
  }

  /**
   * Replace encrypted message with decrypted content
   */
  replaceEncryptedMessage(textNode, decryptedMessage, originalText) {
    try {
      // Create the replacement content
      const container = document.createElement('div');
      container.className = 'asocial-decrypted-message';
      container.style.cssText = `
        background: #000000; border: 2px solid #00ff00; border-radius: 4px;
        padding: 8px; margin: 4px 0; color: #00ff00; font-family: monospace;
        position: relative;
      `;
      
      container.innerHTML = `
        <div class="asocial-tag" style="
          background: #00ff00; color: #000000; padding: 2px 6px; border-radius: 3px;
          font-size: 11px; font-weight: bold; margin-bottom: 4px; display: inline-block;
        ">🔒 DECRYPTED</div>
        <div class="asocial-content" style="color: #00ff00; margin: 4px 0;">${decryptedMessage}</div>
        <button class="asocial-toggle" style="
          background: #000000; color: #00ff00; border: 1px solid #00ff00;
          padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;
        ">Show Encrypted</button>
        <div class="asocial-encrypted" style="display: none; color: #666; font-size: 10px; margin-top: 4px;">${originalText}</div>
      `;
      
      // Replace the text node
      textNode.parentNode.replaceChild(container, textNode);
      
      // Set up toggle functionality
      const toggleBtn = container.querySelector('.asocial-toggle');
      const encryptedDiv = container.querySelector('.asocial-encrypted');
      
      toggleBtn.addEventListener('click', () => {
        if (encryptedDiv.style.display === 'none') {
          encryptedDiv.style.display = 'block';
          toggleBtn.textContent = 'Hide Encrypted';
        } else {
          encryptedDiv.style.display = 'none';
          toggleBtn.textContent = 'Show Encrypted';
        }
      });
      
      console.log('Asocial Universal: Message replaced with decrypted content');
    } catch (error) {
      console.error('Asocial Universal: Error replacing encrypted message:', error);
    }
  }

  /**
   * Show encrypted message (when decryption fails)
   */
  showEncryptedMessage(textNode, originalText) {
    try {
      const container = document.createElement('div');
      container.className = 'asocial-cannot-decrypt';
      container.style.cssText = `
        background: #000000; border: 2px solid #ff0000; border-radius: 4px;
        padding: 8px; margin: 4px 0; color: #ff0000; font-family: monospace;
      `;
      
      container.innerHTML = `
        <div class="asocial-tag" style="
          background: #ff0000; color: #000000; padding: 2px 6px; border-radius: 3px;
          font-size: 11px; font-weight: bold; margin-bottom: 4px; display: inline-block;
        ">🔒 ENCRYPTED</div>
        <div class="asocial-status" style="color: #ff0000; font-size: 12px;">Cannot decrypt - missing key</div>
        <div class="asocial-encrypted" style="color: #666; font-size: 10px; margin-top: 4px;">${originalText}</div>
      `;
      
      textNode.parentNode.replaceChild(container, textNode);
      
      console.log('Asocial Universal: Message marked as encrypted (cannot decrypt)');
    } catch (error) {
      console.error('Asocial Universal: Error showing encrypted message:', error);
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('asocial-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'asocial-notification';
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      padding: 12px 20px; border-radius: 4px; font-weight: 600;
      background: ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#0000ff'};
      color: #000000; border: 2px solid ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#0000ff'};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AsocialUniversal();
  });
} else {
  new AsocialUniversal();
}
