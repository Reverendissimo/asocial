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
    this.injecting = false;
  }

  /**
   * Initialize the LinkedIn integration
   */
  async init() {
    if (this.isInitialized) {
      console.log('Already initialized, skipping');
      return;
    }
    
    console.log('Initializing LinkedIn Asocial integration');
    console.log('Document ready state:', document.readyState);
    
    try {
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        console.log('Document still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        console.log('Document already ready, setting up immediately');
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
    console.log('Setting up LinkedIn integration...');
    
    // Inject "Be Asocial" buttons
    this.injectAsocialButtons();
    
    // Setup message decryption
    this.setupMessageDecryption();
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
    
    // Add a fallback retry mechanism
    setTimeout(() => {
      console.log('Fallback: Checking for buttons after 3 seconds...');
      const existingButtons = document.querySelectorAll('.asocial-button');
      if (existingButtons.length === 0) {
        console.log('No buttons found, retrying injection...');
        this.injectAsocialButtons();
      }
    }, 3000);
    
    // Add another retry after 6 seconds
    setTimeout(() => {
      console.log('Fallback: Checking for buttons after 6 seconds...');
      const existingButtons = document.querySelectorAll('.asocial-button');
      if (existingButtons.length === 0) {
        console.log('No buttons found, retrying injection again...');
        this.injectAsocialButtons();
      }
    }, 6000);
    
    console.log('LinkedIn Asocial integration setup complete');
  }

  /**
   * Inject "Be Asocial" buttons into LinkedIn post areas
   */
  injectAsocialButtons() {
    // Prevent multiple simultaneous injections
    if (this.injecting) {
      console.log('Already injecting buttons, skipping');
      return;
    }
    
    this.injecting = true;
    
    try {
      console.log('Starting button injection...');
      
      // Remove all existing buttons first to prevent duplicates
      const existingButtons = document.querySelectorAll('.asocial-button');
      console.log(`Removing ${existingButtons.length} existing buttons`);
      existingButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
      // Find LinkedIn post input areas
      const postInputs = this.findLinkedInPostInputs();
      console.log(`Found ${postInputs.length} input areas`);
      
      if (postInputs.length === 0) {
        console.log('No input areas found, will retry later');
        return;
      }
      
      for (const input of postInputs) {
        console.log('Creating button for input:', input);
        this.createAsocialButton(input);
      }
      
      console.log('Button injection completed');
    } catch (error) {
      console.error('Error during button injection:', error);
    } finally {
      this.injecting = false;
    }
  }

  /**
   * Find LinkedIn post input areas
   */
  findLinkedInPostInputs() {
    const selectors = [
      // Main post composer - prioritize these
      '.ql-editor[contenteditable="true"][data-placeholder]',
      '.ql-editor[contenteditable="true"]:not(.ql-clipboard)',
      // Comment areas
      '.comments-comment-texteditor .ql-editor',
      // Message composer
      '.msg-form__contenteditable'
    ];
    
    const inputs = [];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`Selector "${selector}" found ${elements.length} elements`);
      
      // Filter out hidden or invalid elements
      const validElements = Array.from(elements).filter(el => {
        // Skip hidden elements
        if (el.offsetParent === null) return false;
        // Skip elements with display: none
        if (getComputedStyle(el).display === 'none') return false;
        // Skip reCAPTCHA elements
        if (el.id && el.id.includes('g-recaptcha')) return false;
        // Skip clipboard elements (they're not user input)
        if (el.classList.contains('ql-clipboard')) return false;
        // Must be visible and have reasonable dimensions
        const rect = el.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 20) return false;
        
        return true;
      });
      
      inputs.push(...validElements);
    }
    
    // Remove duplicates
    const uniqueInputs = [...new Set(inputs)];
    
    console.log(`Total valid input areas found: ${uniqueInputs.length}`);
    return uniqueInputs;
  }

  /**
   * Create "Be Asocial" button for input area
   */
  createAsocialButton(inputArea) {
    console.log('Creating button for input area:', inputArea);
    
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
    
    console.log('Button created and inserted successfully');
  }

  /**
   * Insert button next to input area
   */
  insertButtonNextToInput(inputArea, button) {
    console.log('Inserting button next to input area:', inputArea);
    
    // Find the parent container with multiple fallbacks
    let container = inputArea.closest('.ql-toolbar') || 
                   inputArea.closest('.msg-form__contenteditable-container') ||
                   inputArea.closest('.comments-comment-texteditor') ||
                   inputArea.closest('.ql-container') ||
                   inputArea.closest('.ql-snow') ||
                   inputArea.closest('[class*="editor"]') ||
                   inputArea.closest('[class*="composer"]') ||
                   inputArea.closest('[class*="input"]') ||
                   inputArea.parentElement;
    
    console.log('Found container:', container);
    
    if (container) {
      // Create wrapper for button
      const wrapper = document.createElement('div');
      wrapper.className = 'asocial-button-wrapper';
      wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
      wrapper.appendChild(button);
      
      // Insert after the input area
      container.appendChild(wrapper);
      console.log('Button inserted successfully into container');
    } else {
      console.error('No suitable container found for button insertion');
      // Fallback: try to insert directly after the input area
      if (inputArea.parentNode) {
        const wrapper = document.createElement('div');
        wrapper.className = 'asocial-button-wrapper';
        wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
        wrapper.appendChild(button);
        inputArea.parentNode.insertBefore(wrapper, inputArea.nextSibling);
        console.log('Button inserted using fallback method');
      }
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
      try {
        console.log('Getting key groups...');
        // Get available key groups
        const groups = await this.keyManager.getKeyGroups();
        console.log('Found groups:', groups);
        
        if (groups.length === 0) {
          this.showNotification('No encryption groups found. Please create one in the extension popup.', 'error');
          resolve(null);
          return;
        }
        
        // Create modal
        const modal = this.createKeyGroupModal(groups, resolve);
        document.body.appendChild(modal);
      } catch (error) {
        console.error('Failed to get key groups:', error);
        this.showNotification('Failed to load encryption groups. Please check the extension popup.', 'error');
        resolve(null);
      }
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
    console.log('Setting up mutation observer...');
    
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if new content was added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for new post input areas - be more specific
              const inputs = node.querySelectorAll('.ql-editor[contenteditable="true"]:not(.ql-clipboard)');
              if (inputs.length > 0) {
                console.log(`Mutation observer found ${inputs.length} new input areas`);
                shouldUpdate = true;
              }
              
              // Look for new encrypted messages
              if (node.textContent && node.textContent.includes('[ASOCIAL')) {
                console.log('Mutation observer found encrypted message');
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        // Debounce updates to prevent multiple rapid calls
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          console.log('Updating LinkedIn integration...');
          this.injectAsocialButtons();
          this.decryptExistingMessages();
        }, 2000); // Increased debounce time
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('Mutation observer setup complete');
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

  /**
   * Manual trigger for button injection (for testing)
   */
  manualInjectButtons() {
    console.log('Manual button injection triggered');
    this.injectAsocialButtons();
  }
}

// Initialize when script loads
console.log('LinkedIn content script loading...');
console.log('Document ready state:', document.readyState);
console.log('Window location:', window.location.href);

try {
  const linkedinAsocial = new LinkedInAsocial();
  console.log('LinkedIn content script instance created');
  linkedinAsocial.init();
  console.log('LinkedIn content script initialization called');

  // Expose for manual testing
  window.linkedinAsocial = linkedinAsocial;
  console.log('LinkedIn Asocial instance exposed as window.linkedinAsocial for manual testing');
} catch (error) {
  console.error('Failed to initialize LinkedIn content script:', error);
}
