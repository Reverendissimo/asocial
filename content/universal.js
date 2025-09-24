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
      
      if (selectedText && this.isTextInputElement(event.target)) {
        this.selectedText = selectedText;
        this.selectionRange = selection.getRangeAt(0);
        console.log('Asocial Universal: Text selected:', selectedText.substring(0, 50) + '...');
      } else {
        this.selectedText = '';
        this.selectionRange = null;
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
    if (!this.selectedText) {
      this.showNotification('Please select some text to encrypt', 'error');
      return;
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
    }
  }

  /**
   * Replace selected text with encrypted version
   */
  replaceSelectedText(encryptedText) {
    try {
      if (this.selectionRange) {
        // Delete the selected content
        this.selectionRange.deleteContents();
        
        // Insert the encrypted text
        const textNode = document.createTextNode(encryptedText);
        this.selectionRange.insertNode(textNode);
        
        // Clear selection
        window.getSelection().removeAllRanges();
        
        console.log('Asocial Universal: Text replaced successfully');
      }
    } catch (error) {
      console.error('Asocial Universal: Error replacing text:', error);
      this.showNotification('Failed to replace text', 'error');
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
