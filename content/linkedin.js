/**
 * LinkedIn Content Script
 * Injects "Be Asocial" button and handles encryption/decryption
 */

class LinkedInAsocial {
  constructor() {
    this.encryptionEngine = new AsocialEncryptionEngine();
    this.keyManager = new AsocialKeyManager();
    this.isInitialized = false;
    this.observer = null;
  }

  /**
   * Initialize the LinkedIn integration
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('Initializing LinkedIn Asocial integration');
    
    try {
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize LinkedIn integration:', error);
    }
  }

  /**
   * Setup LinkedIn integration
   */
  async setup() {
    // Inject "Be Asocial" buttons
    this.injectAsocialButtons();
    
    // Setup message decryption
    this.setupMessageDecryption();
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
    
    console.log('LinkedIn Asocial integration setup complete');
  }

  /**
   * Inject "Be Asocial" buttons into LinkedIn post areas
   */
  injectAsocialButtons() {
    // Find LinkedIn post input areas
    const postInputs = this.findLinkedInPostInputs();
    
    for (const input of postInputs) {
      if (input.querySelector('.asocial-button')) continue; // Already injected
      
      this.createAsocialButton(input);
    }
  }

  /**
   * Find LinkedIn post input areas
   */
  findLinkedInPostInputs() {
    const selectors = [
      // Main post composer
      '.ql-editor[contenteditable="true"]',
      '.ql-editor[data-placeholder]',
      // Comment areas
      '.comments-comment-texteditor .ql-editor',
      // Message composer
      '.msg-form__contenteditable',
      // Generic contenteditable
      '[contenteditable="true"]'
    ];
    
    const inputs = [];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      inputs.push(...Array.from(elements));
    }
    
    return inputs;
  }

  /**
   * Create "Be Asocial" button for input area
   */
  createAsocialButton(inputArea) {
    const button = document.createElement('button');
    button.className = 'asocial-button';
    button.innerHTML = '🔒 Be Asocial';
    button.title = 'Encrypt this post for your selected group';
    
    // Style the button
    button.style.cssText = `
      background: #0073b1;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
      transition: background-color 0.2s;
    `;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#005885';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#0073b1';
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAsocialClick(inputArea, button);
    });
    
    // Insert button next to input area
    this.insertButtonNextToInput(inputArea, button);
  }

  /**
   * Insert button next to input area
   */
  insertButtonNextToInput(inputArea, button) {
    // Find the parent container
    let container = inputArea.closest('.ql-toolbar') || 
                   inputArea.closest('.msg-form__contenteditable-container') ||
                   inputArea.closest('.comments-comment-texteditor') ||
                   inputArea.parentElement;
    
    if (container) {
      // Create wrapper for button
      const wrapper = document.createElement('div');
      wrapper.className = 'asocial-button-wrapper';
      wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
      wrapper.appendChild(button);
      
      // Insert after the input area
      container.appendChild(wrapper);
    }
  }

  /**
   * Handle "Be Asocial" button click
   */
  async handleAsocialClick(inputArea, button) {
    try {
      console.log('Be Asocial button clicked');
      
      // Get message content
      const message = this.extractMessageContent(inputArea);
      if (!message || message.trim().length === 0) {
        this.showNotification('Please enter a message to encrypt', 'error');
        return;
      }
      
      // Check message length
      if (message.length > 3000) {
        this.showNotification('Message too long (max 3000 characters for LinkedIn)', 'error');
        return;
      }
      
      // Show key group selection
      const selectedGroup = await this.showKeyGroupSelection();
      if (!selectedGroup) return;
      
      // Show encryption progress
      button.disabled = true;
      button.innerHTML = '🔒 Encrypting...';
      
      // Encrypt message
      const encryptedMessage = await this.encryptionEngine.encryptMessage(message, selectedGroup.id);
      
      // Replace content in input area
      this.replaceInputContent(inputArea, encryptedMessage);
      
      // Show success notification
      this.showNotification(`Message encrypted for group: ${selectedGroup.name}`, 'success');
      
      // Reset button
      button.disabled = false;
      button.innerHTML = '🔒 Be Asocial';
      
    } catch (error) {
      console.error('Encryption failed:', error);
      this.showNotification(`Encryption failed: ${error.message}`, 'error');
      
      // Reset button
      button.disabled = false;
      button.innerHTML = '🔒 Be Asocial';
    }
  }

  /**
   * Extract message content from input area
   */
  extractMessageContent(inputArea) {
    if (inputArea.contentEditable === 'true') {
      return inputArea.textContent || inputArea.innerText || '';
    } else if (inputArea.tagName === 'TEXTAREA') {
      return inputArea.value || '';
    }
    return '';
  }

  /**
   * Replace content in input area
   */
  replaceInputContent(inputArea, newContent) {
    if (inputArea.contentEditable === 'true') {
      inputArea.textContent = newContent;
      inputArea.innerHTML = newContent;
    } else if (inputArea.tagName === 'TEXTAREA') {
      inputArea.value = newContent;
    }
    
    // Trigger input event
    const event = new Event('input', { bubbles: true });
    inputArea.dispatchEvent(event);
  }

  /**
   * Show key group selection modal
   */
  async showKeyGroupSelection() {
    return new Promise(async (resolve) => {
      // Get available key groups
      const groups = await this.keyManager.getKeyGroups();
      
      if (groups.length === 0) {
        this.showNotification('No encryption groups found. Please create one in the extension popup.', 'error');
        resolve(null);
        return;
      }
      
      // Create modal
      const modal = this.createKeyGroupModal(groups, resolve);
      document.body.appendChild(modal);
    });
  }

  /**
   * Create key group selection modal
   */
  createKeyGroupModal(groups, onSelect) {
    const modal = document.createElement('div');
    modal.className = 'asocial-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Select Encryption Group</h3>
      <div class="asocial-groups-list">
        ${groups.map(group => `
          <div class="asocial-group-item" data-group-id="${group.id}" style="
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
          ">
            <div style="font-weight: 600; color: #333;">${group.name}</div>
            <div style="font-size: 12px; color: #666;">${group.contacts.length} contacts</div>
          </div>
        `).join('')}
      </div>
      <button class="asocial-cancel" style="
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        margin-top: 16px;
      ">Cancel</button>
    `;
    
    // Add click handlers
    content.querySelectorAll('.asocial-group-item').forEach(item => {
      item.addEventListener('click', () => {
        const groupId = item.dataset.groupId;
        const group = groups.find(g => g.id === groupId);
        onSelect(group);
        document.body.removeChild(modal);
      });
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f8ff';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white';
      });
    });
    
    content.querySelector('.asocial-cancel').addEventListener('click', () => {
      onSelect(null);
      document.body.removeChild(modal);
    });
    
    modal.appendChild(content);
    return modal;
  }

  /**
   * Setup message decryption
   */
  setupMessageDecryption() {
    // Find and decrypt existing encrypted messages
    this.decryptExistingMessages();
  }

  /**
   * Decrypt existing encrypted messages on page
   */
  async decryptExistingMessages() {
    try {
      const encryptedMessages = this.encryptionEngine.detectEncryptedMessages();
      
      for (const message of encryptedMessages) {
        try {
          const decrypted = await this.encryptionEngine.decryptMessage(message.text);
          await this.encryptionEngine.replaceEncryptedMessage(message.node, decrypted.message);
        } catch (error) {
          console.log('Cannot decrypt message:', error.message);
          this.encryptionEngine.showCannotDecryptMessage(message.node);
        }
      }
    } catch (error) {
      console.error('Failed to decrypt messages:', error);
    }
  }

  /**
   * Setup mutation observer for dynamic content
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if new content was added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for new post input areas
              const inputs = node.querySelectorAll('[contenteditable="true"], textarea');
              if (inputs.length > 0) {
                shouldUpdate = true;
              }
              
      // Look for new encrypted messages
      if (node.textContent && node.textContent.includes('[ASOCIAL')) {
        shouldUpdate = true;
      }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        // Debounce updates
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.injectAsocialButtons();
          this.decryptExistingMessages();
        }, 500);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `asocial-notification asocial-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#0073b1'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize when script loads
const linkedinAsocial = new LinkedInAsocial();
linkedinAsocial.init();
