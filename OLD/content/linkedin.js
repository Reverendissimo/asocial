/**
 * LinkedIn Content Script - UNUSED (replaced by universal.js)
 * Injects "Be Asocial" button and handles encryption/decryption
 * 
 * COMMENTED OUT: This file is no longer used since we switched to universal content script
 * Keep for testing purposes - can be uncommented if LinkedIn-specific functionality is needed
 */

/*

class LinkedInAsocial {
  constructor() {
    this.encryptionEngine = new AsocialEncryptionEngine();
    this.isInitialized = false;
    this.observer = null;
    this.injecting = false;
  }

  /**
   * Initialize the LinkedIn integration
   */
  async init() {
    if (this.isInitialized) {
      return;
    }
    
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
    
    // Add a fallback retry mechanism
    setTimeout(() => {
      const existingButtons = document.querySelectorAll('.asocial-button');
      if (existingButtons.length === 0) {
        this.injectAsocialButtons();
      }
    }, 3000);
    
    // Add another retry after 6 seconds
    setTimeout(() => {
      const existingButtons = document.querySelectorAll('.asocial-button');
      if (existingButtons.length === 0) {
        this.injectAsocialButtons();
      }
    }, 6000);
    
    // Add periodic check every 10 seconds to ensure buttons are always available
    setInterval(() => {
      const inputs = this.findLinkedInPostInputs();
      const buttons = document.querySelectorAll('.asocial-button');
      
      if (inputs.length > 0 && buttons.length === 0) {
        this.injectAsocialButtons();
      }
    }, 10000);
  }

  /**
   * Inject "Be Asocial" buttons into LinkedIn post areas
   */
  injectAsocialButtons() {
    // Prevent multiple simultaneous injections
    if (this.injecting) {
      return;
    }
    
    this.injecting = true;
    
    try {
      // Remove all existing buttons first to prevent duplicates
      const existingButtons = document.querySelectorAll('.asocial-button');
      existingButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
    // Find LinkedIn post input areas
    const postInputs = this.findLinkedInPostInputs();
      
      if (postInputs.length === 0) {
        return;
      }
    
    for (const input of postInputs) {
      this.createAsocialButton(input);
      }
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
    
    return uniqueInputs;
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
      background: #000000;
      color: #00ff00;
      border: 1px solid #00ff00;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 8px;
    `;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#001100';
      button.style.borderColor = '#00ff00';
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#000000';
      button.style.borderColor = '#00ff00';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
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
    
    
    if (container) {
      // Create wrapper for button
      const wrapper = document.createElement('div');
      wrapper.className = 'asocial-button-wrapper';
      wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
      wrapper.appendChild(button);
      
      // Insert after the input area
      container.appendChild(wrapper);
    } else {
      console.error('No suitable container found for button insertion');
      // Fallback: try to insert directly after the input area
      if (inputArea.parentNode) {
        const wrapper = document.createElement('div');
        wrapper.className = 'asocial-button-wrapper';
        wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
        wrapper.appendChild(button);
        inputArea.parentNode.insertBefore(wrapper, inputArea.nextSibling);
      }
    }
  }

  /**
   * Handle "Be Asocial" button click
   */
  async handleAsocialClick(inputArea, button) {
    try {
      
      // Show the encryption modal
      const result = await this.showEncryptionModal(inputArea);
      if (!result) {
        return; // User cancelled
      }
      
      const { message, selectedGroup } = result;
      
      // Check message length
      if (message.length > 3000) {
        this.showNotification('Message too long (max 3000 characters for LinkedIn)', 'error');
        return;
      }
      
      // Show encryption progress
      button.disabled = true;
      button.innerHTML = '🔒 Encrypting...';
      
      // Encrypt message
      const encryptedMessage = await this.encryptionEngine.encryptMessage(message, selectedGroup.id);
      
      // Use execCommand to insert text (preserves LinkedIn's state)
      this.insertTextSafely(inputArea, encryptedMessage);
      
      // Simple approach: just ensure the content is set and LinkedIn knows about it
      setTimeout(() => {
        const currentContent = this.extractMessageContent(inputArea);
        if (!currentContent || currentContent.trim() === '') {
          // Use a more gentle approach to avoid triggering LinkedIn's observers
          if (inputArea.contentEditable === 'true') {
            inputArea.innerHTML = encryptedMessage;
          } else {
            inputArea.value = encryptedMessage;
          }
          
          // Trigger a single input event
          const inputEvent = new Event('input', { bubbles: true });
          inputArea.dispatchEvent(inputEvent);
        }
      }, 500);
      
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
   * Safely insert text using execCommand to preserve LinkedIn's state
   */
  insertTextSafely(inputArea, text) {
    try {
      
      // Focus the input first
      inputArea.focus();
      
      // Clear existing content by selecting all and deleting
      if (inputArea.contentEditable === 'true') {
        // For contenteditable, select all content
        const range = document.createRange();
        range.selectNodeContents(inputArea);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Delete selected content
        document.execCommand('delete', false);
      } else {
        // For textarea/input, select all and delete
        inputArea.select();
        document.execCommand('delete', false);
      }
      
      // Use execCommand to insert the new text
      const success = document.execCommand('insertText', false, text);
      
      if (success) {
        // Text inserted successfully
      } else {
        // Fallback: set content directly
        if (inputArea.contentEditable === 'true') {
          inputArea.textContent = text;
        } else {
          inputArea.value = text;
        }
        
        // Trigger events
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        inputArea.dispatchEvent(inputEvent);
        inputArea.dispatchEvent(changeEvent);
      }
      
      // Additional events to trigger LinkedIn's validation
      setTimeout(() => {
        // Trigger focus/blur cycle to wake up LinkedIn's validation
        inputArea.blur();
        setTimeout(() => {
          inputArea.focus();
          
          // Trigger additional events that LinkedIn might be listening for
          const keyupEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
          });
          inputArea.dispatchEvent(keyupEvent);
          
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true
          });
          inputArea.dispatchEvent(pasteEvent);
          
          // Trigger composition events
          const compositionStart = new CompositionEvent('compositionstart', {
            bubbles: true,
            cancelable: true
          });
          inputArea.dispatchEvent(compositionStart);
          
          const compositionEnd = new CompositionEvent('compositionend', {
            bubbles: true,
            cancelable: true
          });
          inputArea.dispatchEvent(compositionEnd);
          
        }, 100);
      }, 100);
      
      // Set cursor to end
      if (inputArea.contentEditable === 'true') {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputArea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
    } catch (error) {
      console.error('Error with safe text insertion:', error);
      // Final fallback
      if (inputArea.contentEditable === 'true') {
        inputArea.textContent = text;
      } else {
        inputArea.value = text;
      }
    }
  }

  /**
   * Use execCommand with proper event triggering for LinkedIn
   */
  async simulateTyping(inputArea, text) {
    try {
      
      // Focus the input first
      inputArea.focus();
      
      // Clear existing content
      if (inputArea.contentEditable === 'true') {
        inputArea.innerHTML = '';
      } else {
        inputArea.value = '';
      }
      
      // Use execCommand to insert text
      const success = document.execCommand('insertText', false, text);
      
      if (success) {
        
        // Now trigger the specific events that LinkedIn's React components need
        // Trigger input event with proper data
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        
        // Trigger keyup event (LinkedIn might be listening for this)
        const keyupEvent = new KeyboardEvent('keyup', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13
        });
        
        // Trigger blur and focus to simulate user interaction
        const blurEvent = new Event('blur', { bubbles: true, cancelable: true });
        const focusEvent = new Event('focus', { bubbles: true, cancelable: true });
        
        // Dispatch events in sequence
        inputArea.dispatchEvent(inputEvent);
        inputArea.dispatchEvent(changeEvent);
        inputArea.dispatchEvent(keyupEvent);
        
        // Small delay then blur/focus to trigger LinkedIn's state updates
        setTimeout(() => {
          inputArea.dispatchEvent(blurEvent);
          setTimeout(() => {
            inputArea.dispatchEvent(focusEvent);
          }, 10);
        }, 50);
        
      } else {
        // Fallback: set content directly
        if (inputArea.contentEditable === 'true') {
          inputArea.textContent = text;
        } else {
          inputArea.value = text;
        }
        
        // Trigger events
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        inputArea.dispatchEvent(inputEvent);
        inputArea.dispatchEvent(changeEvent);
      }
      
      // Set cursor to end
      if (inputArea.contentEditable === 'true') {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputArea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      
    } catch (error) {
      console.error('Error with execCommand approach:', error);
      // Final fallback to gentle replacement
      this.replaceInputContentGentle(inputArea, text);
    }
  }

  /**
   * Gentle content replacement for messaging contexts
   */
  replaceInputContentGentle(inputArea, newContent) {
    try {
      
      // For messaging, we need to be very careful not to break LinkedIn's state
      if (inputArea.contentEditable === 'true') {
        // Instead of replacing, let's try appending to preserve LinkedIn's state
        const currentContent = inputArea.textContent || inputArea.innerText || '';
        
        // If there's existing content, append with a space
        if (currentContent.trim()) {
          inputArea.textContent = currentContent + ' ' + newContent;
        } else {
          inputArea.textContent = newContent;
        }
        
        // Set cursor position to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputArea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        const currentValue = inputArea.value || '';
        if (currentValue.trim()) {
          inputArea.value = currentValue + ' ' + newContent;
        } else {
          inputArea.value = newContent;
        }
      }
      
      // Trigger events very gently
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      inputArea.dispatchEvent(inputEvent);
      
      // Small delay before change event
      setTimeout(() => {
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        inputArea.dispatchEvent(changeEvent);
      }, 50);
      
      // Focus
      inputArea.focus();
      
    } catch (error) {
      console.error('Error in gentle content replacement:', error);
      // Fallback - just append
      const currentContent = inputArea.textContent || inputArea.innerText || '';
      inputArea.textContent = currentContent + ' ' + newContent;
    }
  }

  /**
   * Replace content in input area
   */
  replaceInputContent(inputArea, newContent) {
    try {
    if (inputArea.contentEditable === 'true') {
        // For contenteditable, be very gentle to avoid triggering LinkedIn's observers
        // Clear existing content first
        inputArea.innerHTML = '';
        
        // Add the new content as a text node to avoid HTML parsing issues
        const textNode = document.createTextNode(newContent);
        inputArea.appendChild(textNode);
        
        // Set cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputArea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        
    } else if (inputArea.tagName === 'TEXTAREA') {
      inputArea.value = newContent;
    }
    
      // Trigger events in the correct order to maintain LinkedIn's state
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      
      // Dispatch input first
      inputArea.dispatchEvent(inputEvent);
      
      // Small delay before change event
      setTimeout(() => {
        inputArea.dispatchEvent(changeEvent);
      }, 10);
      
      // Focus the input
      inputArea.focus();
      
    } catch (error) {
      console.error('Error replacing input content:', error);
      // Fallback: just set the value directly
      if (inputArea.contentEditable === 'true') {
        inputArea.textContent = newContent;
      } else {
        inputArea.value = newContent;
      }
    }
  }

  /**
   * Show encryption modal with message input and key selection
   */
  async showEncryptionModal(inputArea) {
    return new Promise(async (resolve) => {
      // Get current message content
      const currentMessage = this.extractMessageContent(inputArea);
      
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Create modal content
      const content = document.createElement('div');
      content.style.cssText = `
        background: #000000;
        border: 2px solid #00ff00;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
      `;
      
      content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #00ff00; font-weight: bold;">Encrypt Message</h3>
        <div style="margin-bottom: 16px;">
          <label style="display: block; color: #00ff00; margin-bottom: 8px; font-weight: 600;">Message to encrypt:</label>
          <textarea id="asocial-message-input" style="
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 1px solid #00ff00;
            border-radius: 4px;
            background: #000000;
            color: #00ff00;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
          " placeholder="Enter your message here...">${currentMessage}</textarea>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; color: #00ff00; margin-bottom: 8px; font-weight: 600;">Select encryption key:</label>
          <div id="asocial-key-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #00ff00; border-radius: 4px; background: #000000;">
            <!-- Keys will be loaded here -->
          </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="asocial-encrypt-cancel" style="
            background: #000000;
            color: #00ff00;
            border: 1px solid #00ff00;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;
      
      overlay.appendChild(content);
      document.body.appendChild(overlay);
      
      // Load writer keys
      const result = await chrome.storage.local.get(['asocial_temp_storage']);
      const tempStorage = result.asocial_temp_storage;
      
      if (!tempStorage || !tempStorage.writerKeys) {
        this.showNotification('No writer keys found. Please create one in the extension popup.', 'error');
        document.body.removeChild(overlay);
        resolve(null);
        return;
      }
      
      const groups = tempStorage.writerKeys.map(group => ({
        ...group,
        storageName: tempStorage.storageName || 'Unknown'
      }));
      
      const keyList = document.getElementById('asocial-key-list');
      groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'asocial-group-item';
        item.setAttribute('data-group-id', group.id);
        item.style.cssText = `
          padding: 6px 10px;
          border-bottom: 1px solid #00ff00;
          cursor: pointer;
          transition: background-color 0.2s;
          background: #000000;
          color: #00ff00;
          font-size: 12px;
        `;
        item.innerHTML = `
          <div style="font-weight: 600; color: #00ff00; margin-bottom: 2px;">${group.name}</div>
          <div style="font-size: 11px; color: #00ff00; opacity: 0.8;">Storage: ${group.storageName || 'Unknown'}</div>
        `;
        
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#001100';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = '#000000';
        });
        
        keyList.appendChild(item);
      });
      
      let selectedGroup = null;
      
      // Handle key selection - auto-encrypt when key is selected
      keyList.addEventListener('click', async (e) => {
        const groupItem = e.target.closest('.asocial-group-item');
        if (groupItem) {
          // Remove previous selection
          keyList.querySelectorAll('.asocial-group-item').forEach(item => {
            item.style.backgroundColor = '#000000';
            item.style.border = 'none';
          });
          
          // Select this group
          groupItem.style.backgroundColor = '#001100';
          groupItem.style.border = '2px solid #00ff00';
          selectedGroup = groups.find(g => g.id === groupItem.getAttribute('data-group-id'));
          
          // Get message and encrypt immediately
          const messageInput = document.getElementById('asocial-message-input');
          const message = messageInput.value.trim();
          
          if (!message) {
            this.showNotification('Please enter a message to encrypt', 'error');
            return;
          }
          
          // Close modal and resolve with the result
          document.body.removeChild(overlay);
          resolve({ message, selectedGroup });
        }
      });
      
      // Handle Cancel button
      document.getElementById('asocial-encrypt-cancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      // Handle overlay click to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(null);
        }
      });
    });
  }

  /**
   * Show key group selection modal
   */
  async showKeyGroupSelection() {
    return new Promise(async (resolve) => {
        try {
          // Get writer keys from the new encrypted storage
        const result = await chrome.storage.local.get(['asocial_temp_storage']);
        const tempStorage = result.asocial_temp_storage;
        
        if (!tempStorage || !tempStorage.writerKeys) {
          this.showNotification('No writer keys found. Please create one in the extension popup.', 'error');
          resolve(null);
          return;
        }
        
        const groups = tempStorage.writerKeys.map(group => ({
          ...group,
          storageName: tempStorage.storageName || 'Unknown'
        }));
      
      if (groups.length === 0) {
          this.showNotification('No writer keys found. Please create one in the extension popup.', 'error');
        resolve(null);
        return;
      }
      
      // Create modal
      const modal = this.createKeyGroupModal(groups, resolve);
      document.body.appendChild(modal);
      } catch (error) {
        console.error('Failed to get writer keys:', error);
        this.showNotification('Failed to load writer keys. Please check the extension popup.', 'error');
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
      background: #000000;
      border: 2px solid #00ff00;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #00ff00; font-weight: bold;">Select Writer Key</h3>
      <div class="asocial-groups-list">
        ${groups.map(group => `
          <div class="asocial-group-item" data-group-id="${group.id}" style="
            padding: 8px 12px;
            border: 1px solid #00ff00;
            border-radius: 4px;
            margin-bottom: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            background: #000000;
            color: #00ff00;
            font-size: 14px;
          ">
            <div style="font-weight: 600; color: #00ff00; margin-bottom: 2px;">${group.name}</div>
            <div style="font-size: 11px; color: #00ff00; opacity: 0.8;">Storage: ${group.storageName || 'Unknown'}</div>
          </div>
        `).join('')}
      </div>
      <button class="asocial-cancel" style="
        background: #000000;
        border: 1px solid #00ff00;
        color: #00ff00;
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
        item.style.backgroundColor = '#001100';
        item.style.borderColor = '#00ff00';
        item.style.transform = 'scale(1.02)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '#000000';
        item.style.borderColor = '#00ff00';
        item.style.transform = 'scale(1)';
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
    
    // Trigger decryption on page load with delay
    window.addEventListener('load', () => {
      setTimeout(() => this.decryptExistingMessages(), 2000);
    });
    
    // Trigger decryption when scrolling (for infinite scroll) - less frequently
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.decryptExistingMessages();
      }, 2000); // Increased delay to reduce conflicts
    });
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
          if (error.message.includes('Not an Asocial encrypted message')) {
            continue;
          }
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
              // Look for new post input areas - be more comprehensive
              const inputs = node.querySelectorAll('.ql-editor[contenteditable="true"]:not(.ql-clipboard)');
              if (inputs.length > 0) {
                shouldUpdate = true;
              }
              
              // Also check if the node itself is an input area
              if (node.classList && node.classList.contains('ql-editor') && 
                  node.getAttribute('contenteditable') === 'true' && 
                  !node.classList.contains('ql-clipboard')) {
                shouldUpdate = true;
              }
              
              // Look for encrypted messages in feed posts
      if (node.textContent && node.textContent.includes('[ASOCIAL')) {
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
          this.injectAsocialButtons();
          // Only decrypt if we're not in the middle of encryption
          if (!this.injecting) {
          this.decryptExistingMessages();
          }
        }, 1000); // Reduced debounce time for better responsiveness
      }
    });
    
    // Observe the main content area with subtree to catch all input areas
    const feedContainer = document.querySelector('.scaffold-layout__content') || document.body;
    this.observer.observe(feedContainer, {
      childList: true,
      subtree: true // Re-enable subtree to catch input areas
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

  /**
   * Manual trigger for button injection (for testing)
   */
  manualInjectButtons() {
    this.injectAsocialButtons();
  }

  /**
   * Force refresh - manually trigger button injection and decryption
   */
  forceRefresh() {
    this.injectAsocialButtons();
    this.decryptExistingMessages();
  }
}

// Initialize when script loads
try {
const linkedinAsocial = new LinkedInAsocial();
linkedinAsocial.init();

  // Expose for manual testing
  window.linkedinAsocial = linkedinAsocial;
} catch (error) {
  console.error('Failed to initialize LinkedIn content script:', error);
}

// LinkedIn username detection removed - using storage name instead

*/
