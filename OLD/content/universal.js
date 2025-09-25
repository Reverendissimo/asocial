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
    this.originalElement = null; // Store the original element that had focus
    this.encryptedText = null; // Store the encrypted text for pasting
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
   * Replace selected text with encrypted version - CLIPBOARD ONLY
   */
  replaceSelectedText(encryptedText) {
    try {
      console.log('Asocial Universal: Copying encrypted text to clipboard');
      console.log('Encrypted text:', encryptedText.substring(0, 100) + '...');
      
      // Store the encrypted text for pasting
      this.encryptedText = encryptedText;
      
      // ALWAYS use clipboard approach - no text replacement
      this.copyToClipboard(encryptedText);
      
    } catch (error) {
      console.error('Asocial Universal: Error copying to clipboard:', error);
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Copy text to clipboard using multiple methods
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
   * Fallback clipboard method using execCommand
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
          // For regular inputs, use select() method
          targetElement.select();
          console.log('Input text selected');
        }
        
        // Store the selected text and element for the modal
        this.selectedText = targetElement.textContent || targetElement.value || '';
        this.originalElement = targetElement;
        console.log('Selected text stored:', this.selectedText.substring(0, 50) + '...');
      } else {
        console.log('No target element found for selection');
      }
    } catch (error) {
      console.error('Error selecting text:', error);
    }
  }

  /**
   * Select all text in the original element using Ctrl+A simulation
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
            // For contentEditable, try multiple methods
            console.log('Using contentEditable selection methods');
            
            // Method 1: execCommand
            const success1 = document.execCommand('selectAll', false, null);
            console.log('execCommand selectAll result:', success1);
            
            // Method 2: Range selection
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(targetElement);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('Range selection applied');
            
          } else {
            // For regular inputs, use select() method
            console.log('Using input select() method');
            targetElement.select();
            console.log('Input select() called');
            
            // Also try to set selection range manually
            if (targetElement.setSelectionRange) {
              targetElement.setSelectionRange(0, targetElement.value.length);
              console.log('setSelectionRange called');
            }
          }
          
          console.log('Text selection completed');
          
          // After selecting text, try to paste the content
          setTimeout(() => {
            console.log('Attempting to paste encrypted text');
            
            // Method 1: Try execCommand paste
            const pasteSuccess = document.execCommand('paste', false, null);
            console.log('execCommand paste result:', pasteSuccess);
            
            // Method 2: If paste didn't work, try execCommand insertText
            if (!pasteSuccess) {
              console.log('Paste failed, trying insertText');
              const insertSuccess = document.execCommand('insertText', false, this.encryptedText || '');
              console.log('execCommand insertText result:', insertSuccess);
            }
            
            // Method 3: Direct text insertion as fallback
            if (!pasteSuccess && !document.execCommand('insertText', false, this.encryptedText || '')) {
              console.log('Both paste methods failed, using direct insertion');
              if (targetElement.contentEditable === 'true') {
                targetElement.textContent = this.encryptedText || '';
              } else {
                targetElement.value = this.encryptedText || '';
              }
              
              // Trigger input event
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              targetElement.dispatchEvent(inputEvent);
              console.log('Direct text insertion completed');
            }
            
            console.log('Paste attempt completed');
          }, 200); // Wait a bit longer for selection to complete
        }, 100);
        
        console.log('Text selected for easy pasting');
      } else {
        console.log('No target element found for selection');
      }
    } catch (error) {
      console.error('Error selecting text:', error);
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
        
        // Trigger minimal events to avoid detection
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        
        targetInput.dispatchEvent(inputEvent);
        
        // Small delay then trigger change
        setTimeout(() => {
          targetInput.dispatchEvent(changeEvent);
        }, 50);
        
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
      // Simple text replacement - just replace the text content
      const newText = `[ASOCIAL] ${decryptedMessage}`;
      textNode.textContent = newText;
      
      console.log('Asocial Universal: Message replaced with simple decrypted text');
    } catch (error) {
      console.error('Asocial Universal: Error replacing encrypted message:', error);
    }
  }

  /**
   * Show encrypted message (when decryption fails)
   */
  showEncryptedMessage(textNode, originalText) {
    try {
      // Simple text replacement - just add a prefix to show it's encrypted
      const newText = `[ASOCIAL ENCRYPTED] ${originalText}`;
      textNode.textContent = newText;
      
      console.log('Asocial Universal: Message marked as encrypted (simple text)');
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
