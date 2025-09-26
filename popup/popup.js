/**
 * Asocial Extension JavaScript
 * Single panel design with dynamic DOM manipulation
 */

class AsocialExtension {
  constructor() {
    this.currentPanel = 'keystore-selection';
    this.activeKeyStore = null;
    this.currentKeystoreId = null;
    this.init();
  }

  async init() {
    try {
      console.log('Asocial Extension: Initializing...');
      console.log('Asocial Extension: Current KeyStore ID:', this.currentKeystoreId);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      
      // Load initial state
      await this.loadInitialState();
      
      console.log('Asocial Extension: Initialized successfully');
      
    } catch (error) {
      console.error('Asocial Extension: Initialization failed:', error);
      this.showNotification('Initialization failed', 'error');
    }
  }


  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // KeyStore selection panel
    document.getElementById('create-keystore-btn').addEventListener('click', () => {
      this.showPanel('keystore-creation-panel');
    });

    document.getElementById('import-keystore-btn').addEventListener('click', () => {
      this.showModal('import-modal');
    });


    // KeyStore creation panel
    document.getElementById('keystore-creation-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleKeyStoreCreation();
    });

    document.getElementById('cancel-creation').addEventListener('click', () => {
      this.showPanel('keystore-selection-panel');
    });

    document.getElementById('back-to-selection').addEventListener('click', () => {
      this.showPanel('keystore-selection-panel');
    });

    // KeyStore authentication panel
    document.getElementById('keystore-auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleKeyStoreAuthentication();
    });

    document.getElementById('cancel-auth').addEventListener('click', () => {
      this.showPanel('keystore-selection-panel');
    });

    document.getElementById('back-to-selection-auth').addEventListener('click', () => {
      this.showPanel('keystore-selection-panel');
    });

    // Key management panel
    document.getElementById('close-keystore').addEventListener('click', () => {
      this.closeKeyStore();
    });

    document.getElementById('create-writer-key').addEventListener('click', () => {
      this.showKeyCreationModal('writer');
    });


    document.getElementById('add-reader-key').addEventListener('click', () => {
      this.showKeyCreationModal('reader');
    });

    // Key creation modal
    document.getElementById('key-creation-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleKeyCreation();
    });

    document.getElementById('cancel-key-creation').addEventListener('click', () => {
      this.hideModal('key-creation-modal');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.hideModal('key-creation-modal');
    });

    // Import modal
    document.getElementById('import-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleKeyStoreImport();
    });

    document.getElementById('cancel-import').addEventListener('click', () => {
      this.hideModal('import-modal');
    });

    document.getElementById('close-import-modal').addEventListener('click', () => {
      this.hideModal('import-modal');
    });

    // Password input handling is now done dynamically in setupPasswordInputListeners

    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.hideModal(e.target.id);
      }
    });
  }

  /**
   * Load initial state
   */
  async loadInitialState() {
    try {
      // Check if there's an active KeyStore in the background
      const result = await chrome.runtime.sendMessage({ action: 'getActiveKeyStore' });
      
      if (result.success && result.keyStore) {
        // KeyStore is active, go directly to key management
        this.activeKeyStore = result.keyStore;
        this.showPanel('key-management-panel');
        this.updateKeyManagementPanel();
      } else {
        // No active KeyStore, show selection panel
        this.showPanel('keystore-selection-panel');
        this.loadKeyStoreList();
      }
    } catch (error) {
      console.error('Asocial Extension: Error loading initial state:', error);
      // Fallback to showing the selection panel
      try {
        this.showPanel('keystore-selection-panel');
        this.loadKeyStoreList();
      } catch (fallbackError) {
        console.error('Asocial Extension: Fallback panel display failed:', fallbackError);
      }
    }
  }

  /**
   * Show specific panel
   */
  showPanel(panelId) {
    try {
      // Hide all panels
      const panels = document.querySelectorAll('.panel');
      if (panels.length === 0) {
        console.error('Asocial Extension: No panels found in DOM');
        return;
      }
      
      panels.forEach(panel => {
        panel.classList.remove('active');
      });

      // Show target panel
      const targetPanel = document.getElementById(panelId);
      if (!targetPanel) {
        console.error('Asocial Extension: Target panel not found:', panelId);
      return;
    }
    
      targetPanel.classList.add('active');
      this.currentPanel = panelId;


      // Load panel-specific data
      switch (panelId) {
        case 'keystore-selection-panel':
          this.loadKeyStoreList();
          break;
        case 'key-management-panel':
          this.updateKeyManagementPanel();
          break;
      }
    } catch (error) {
      console.error('Asocial Extension: Error showing panel:', error);
    }
  }

  /**
   * Show modal
   */
  showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  /**
   * Load KeyStore list
   */
  async loadKeyStoreList() {
    try {
      console.log('Asocial Extension: Loading KeyStore list...');
      const result = await chrome.runtime.sendMessage({ action: 'getKeyStoreList' });
      console.log('Asocial Extension: Received KeyStore list result:', result);
      
      if (result.success && result.keyStores && result.keyStores.length > 0) {
        this.displayKeyStoreList(result.keyStores);
      } else {
        this.displayNoKeyStores();
      }
    } catch (error) {
      console.error('Asocial Extension: Error loading KeyStore list:', error);
      this.displayNoKeyStores();
    }
  }


  /**
   * Display list of available KeyStores
   */
  displayKeyStoreList(keyStores) {
    console.log('Asocial Extension: Displaying KeyStore list:', keyStores);
    const container = document.getElementById('keystore-list-container');
    if (!container) return;

    container.innerHTML = `
      <div class="keystore-list">
        <h3>Available KeyStores</h3>
        <div class="keystore-items">
          ${keyStores.map(keystore => `
            <div class="keystore-item" data-keystore-id="${keystore.id}">
              <div class="keystore-info">
                <div class="keystore-name">${keystore.name}</div>
                <div class="keystore-description">${keystore.description || 'No description'}</div>
                <div class="keystore-date">Created: ${new Date(keystore.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="keystore-actions">
                <button class="btn btn-primary keystore-open-btn" data-keystore-id="${keystore.id}">
                  Open
                </button>
                <button class="btn btn-secondary keystore-export-btn" data-keystore-id="${keystore.id}">
                  Export
                </button>
                <button class="btn btn-danger keystore-delete-btn" data-keystore-id="${keystore.id}">
                  Delete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Add event listeners for open buttons
    const openButtons = container.querySelectorAll('.keystore-open-btn');
    console.log('Asocial Extension: Found open buttons:', openButtons.length);
    openButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        console.log('Asocial Extension: Button clicked!');
        console.log('Asocial Extension: Button element:', e.target);
        console.log('Asocial Extension: Button attributes:', e.target.attributes);
        const keystoreId = e.target.getAttribute('data-keystore-id');
        console.log('Asocial Extension: Button clicked, KeyStore ID:', keystoreId);
        this.openKeyStore(keystoreId);
      });
    });

    // Add event listeners for export buttons
    const exportButtons = container.querySelectorAll('.keystore-export-btn');
    console.log('Asocial Extension: Found export buttons:', exportButtons.length);
    exportButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const keystoreId = e.target.getAttribute('data-keystore-id');
        console.log('Asocial Extension: Export button clicked, KeyStore ID:', keystoreId);
        this.exportKeyStore(keystoreId);
      });
    });

    // Add event listeners for delete buttons
    const deleteButtons = container.querySelectorAll('.keystore-delete-btn');
    console.log('Asocial Extension: Found delete buttons:', deleteButtons.length);
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const keystoreId = e.target.getAttribute('data-keystore-id');
        console.log('Asocial Extension: Delete button clicked, KeyStore ID:', keystoreId);
        this.deleteKeyStore(keystoreId);
      });
    });
    
  }

  /**
   * Display message when no KeyStores exist
   */
  displayNoKeyStores() {
    const container = document.getElementById('keystore-list-container');
    if (!container) return;

    container.innerHTML = `
      <div class="no-keystores">
        <p>No KeyStores found. Create your first KeyStore to get started.</p>
      </div>
    `;
  }

  /**
   * Open a KeyStore (show password input under KeyStore item)
   */
  async openKeyStore(keystoreId) {
    console.log('Asocial Extension: Opening KeyStore with ID:', keystoreId);
    this.currentKeystoreId = keystoreId;
    
    // Hide all existing password inputs
    const existingInputs = document.querySelectorAll('.keystore-password-input');
    existingInputs.forEach(input => input.remove());
    
    // Find the KeyStore item and add password input
    const keystoreItem = document.querySelector(`[data-keystore-id="${keystoreId}"]`);
    if (keystoreItem) {
      const passwordContainer = document.createElement('div');
      passwordContainer.className = 'keystore-password-input';
      passwordContainer.innerHTML = `
        <div class="password-input-container">
          <input type="password" class="password-input" placeholder="Enter password" data-keystore-id="${keystoreId}">
          <div class="password-actions">
            <button class="btn btn-primary confirm-password" data-keystore-id="${keystoreId}">Open</button>
            <button class="btn btn-secondary cancel-password" data-keystore-id="${keystoreId}">Cancel</button>
          </div>
        </div>
      `;
      
      keystoreItem.appendChild(passwordContainer);
      
      // Focus on password input
      setTimeout(() => {
        const passwordInput = passwordContainer.querySelector('.password-input');
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
      
      // Add event listeners for this specific KeyStore
      this.setupPasswordInputListeners(keystoreId);
    }
  }

  /**
   * Delete a KeyStore with confirmation
   */
  async deleteKeyStore(keystoreId) {
    console.log('Asocial Extension: Deleting KeyStore with ID:', keystoreId);
    
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this KeyStore? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'deleteKeyStore',
        keystoreId: keystoreId
      });

      if (result.success) {
        this.showNotification('KeyStore deleted successfully', 'success');
        this.loadKeyStoreList(); // Refresh the list
      } else {
        this.showNotification('Failed to delete KeyStore: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Asocial Extension: Error deleting KeyStore:', error);
      this.showNotification('Error deleting KeyStore', 'error');
    }
  }

  /**
   * Set up password input event listeners for a specific KeyStore
   */
  setupPasswordInputListeners(keystoreId) {
    const passwordInput = document.querySelector(`.password-input[data-keystore-id="${keystoreId}"]`);
    const confirmBtn = document.querySelector(`.confirm-password[data-keystore-id="${keystoreId}"]`);
    const cancelBtn = document.querySelector(`.cancel-password[data-keystore-id="${keystoreId}"]`);
    
    if (passwordInput) {
      // Handle Enter key
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handlePasswordConfirm(keystoreId);
        }
      });
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.handlePasswordConfirm(keystoreId);
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.handlePasswordCancel(keystoreId);
      });
    }
  }

  /**
   * Handle password confirmation
   */
  async handlePasswordConfirm(keystoreId) {
    const passwordInput = document.querySelector(`.password-input[data-keystore-id="${keystoreId}"]`);
    const password = passwordInput ? passwordInput.value : '';
    
    if (!password) {
      this.showNotification('Please enter a password', 'error');
      return;
    }

    console.log('Asocial Extension: Confirming password for KeyStore ID:', keystoreId);

    try {
      const result = await chrome.runtime.sendMessage({ 
        action: 'openKeyStore', 
        keystoreId: keystoreId, 
        password: password 
      });

      if (result.success) {
        this.activeKeyStore = result.keyStore;
        this.showPanel('key-management-panel');
        this.updateKeyManagementPanel();
        this.showNotification('KeyStore opened successfully', 'success');
        // Remove password input
        const passwordContainer = document.querySelector(`.keystore-password-input`);
        if (passwordContainer) {
          passwordContainer.remove();
        }
      } else {
        this.showNotification('Failed to open KeyStore: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Asocial Extension: Error opening KeyStore:', error);
      this.showNotification('Error opening KeyStore', 'error');
    }
  }

  /**
   * Handle password cancellation
   */
  handlePasswordCancel(keystoreId) {
    const passwordContainer = document.querySelector(`.keystore-password-input`);
    if (passwordContainer) {
      passwordContainer.remove();
    }
    this.currentKeystoreId = null;
  }

  /**
   * Handle KeyStore creation
   */
  async handleKeyStoreCreation() {
    try {
      const name = document.getElementById('keystore-name').value;
      const description = document.getElementById('keystore-description').value;
      const password = document.getElementById('keystore-password').value;
      const passwordConfirm = document.getElementById('keystore-password-confirm').value;

      // Validate inputs
      if (!name.trim()) {
        this.showNotification('KeyStore name is required', 'error');
        return;
      }
      
      if (password !== passwordConfirm) {
        this.showNotification('Passwords do not match', 'error');
        return;
      }
      
      if (password.length < 8) {
        this.showNotification('Password must be at least 8 characters', 'error');
        return;
      }
      
      // Create KeyStore
      const result = await chrome.runtime.sendMessage({
        action: 'createKeyStore',
        name: name.trim(),
        description: description.trim(),
        password: password
      });

      if (result.success) {
        this.showNotification('KeyStore created successfully!', 'success');
        this.showPanel('key-management-panel');
        this.updateKeyManagementPanel();
      } else {
        this.showNotification(result.error || 'Failed to create KeyStore', 'error');
      }
    } catch (error) {
      console.error('Asocial Extension: Error creating KeyStore:', error);
      this.showNotification('Failed to create KeyStore', 'error');
    }
  }

  /**
   * Handle KeyStore authentication
   */
  async handleKeyStoreAuthentication() {
    try {
      const password = document.getElementById('auth-password').value;

      if (!password) {
        this.showNotification('Password is required', 'error');
        return;
      }
      
      // TODO: Implement KeyStore authentication
      // This will be implemented in Phase 3
      this.showNotification('KeyStore authentication not yet implemented', 'error');
    } catch (error) {
      console.error('Asocial Popup: Error authenticating KeyStore:', error);
      this.showNotification('Failed to authenticate KeyStore', 'error');
    }
  }

  /**
   * Close current KeyStore
   */
  async closeKeyStore() {
    try {
      const result = await chrome.runtime.sendMessage({ action: 'closeKeyStore' });
      
      if (result.success) {
        this.activeKeyStore = null;
        this.showPanel('keystore-selection-panel');
        this.showNotification('KeyStore closed', 'success');
      } else {
        this.showNotification('Failed to close KeyStore', 'error');
      }
    } catch (error) {
      console.error('Asocial Popup: Error closing KeyStore:', error);
      this.showNotification('Failed to close KeyStore', 'error');
    }
  }

  /**
   * Update key management panel
   */
  async updateKeyManagementPanel() {
    try {
      // Update KeyStore name
      if (this.activeKeyStore) {
        document.getElementById('active-keystore-name').textContent = this.activeKeyStore.name;
      }

      // Load writer keys
      await this.loadWriterKeys();
      
      // Load reader keys
      await this.loadReaderKeys();
    } catch (error) {
      console.error('Asocial Extension: Error updating key management panel:', error);
    }
  }

  /**
   * Load writer keys
   */
  async loadWriterKeys() {
    try {
      const keys = await chrome.runtime.sendMessage({ action: 'getWriterKeys' });
      
      // Check if KeyStore session expired
      if (!keys.success && (keys.error && keys.error.includes('session expired'))) {
        console.log('Asocial Extension: KeyStore session expired, redirecting to KeyStore selection');
        this.showPanel('keystore-selection-panel');
        this.loadKeyStoreList();
        this.showNotification('KeyStore session expired. Please open KeyStore again.', 'warning');
        return;
      }
      
      this.displayKeys('writer-keys-list', keys, 'writer');
    } catch (error) {
      console.error('Asocial Extension: Error loading writer keys:', error);
      // On error, redirect to KeyStore selection
      this.showPanel('keystore-selection-panel');
      this.loadKeyStoreList();
    }
  }

  /**
   * Load reader keys
   */
  async loadReaderKeys() {
    try {
      const keys = await chrome.runtime.sendMessage({ action: 'getReaderKeys' });
      
      // Check if KeyStore session expired
      if (!keys.success && (keys.error && keys.error.includes('session expired'))) {
        console.log('Asocial Extension: KeyStore session expired, redirecting to KeyStore selection');
        this.showPanel('keystore-selection-panel');
        this.loadKeyStoreList();
        this.showNotification('KeyStore session expired. Please open KeyStore again.', 'warning');
        return;
      }
      
      this.displayKeys('reader-keys-list', keys, 'reader');
    } catch (error) {
      console.error('Asocial Extension: Error loading reader keys:', error);
      // On error, redirect to KeyStore selection
      this.showPanel('keystore-selection-panel');
      this.loadKeyStoreList();
    }
  }

  /**
   * Display keys in list
   */
  displayKeys(containerId, keys, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (keys.length === 0) {
      container.innerHTML = `<div class="no-keys">No ${type} keys found</div>`;
      return;
    }

    keys.forEach(key => {
      const keyItem = document.createElement('div');
      keyItem.className = 'key-item';
      
      // Add Copy Private Key button for writer keys
      const copyButton = type === 'writer' ? 
        `<button class="btn btn-secondary copy-private-key-btn" data-key-id="${key.id}">Copy Reader Key</button>` : '';
      
      keyItem.innerHTML = `
        <div class="key-info">
          <h4>${key.name}</h4>
          <p>Created: ${new Date(key.createdAt).toLocaleDateString()}</p>
          <p class="magic-code">Magic: ${key.magicCode || 'N/A'}</p>
        </div>
        <div class="key-actions">
          ${copyButton}
          <button class="btn-delete key-delete-btn" data-key-id="${key.id}">Delete</button>
        </div>
      `;
      container.appendChild(keyItem);
    });

    // Add event listeners for delete buttons
    const deleteButtons = container.querySelectorAll('.key-delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const keyId = e.target.getAttribute('data-key-id');
        this.deleteKey(keyId);
      });
    });

    // Add event listeners for copy private key buttons (writer keys only)
    if (type === 'writer') {
      const copyButtons = container.querySelectorAll('.copy-private-key-btn');
      copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const keyId = e.target.getAttribute('data-key-id');
          this.copyPrivateKey(keyId);
        });
      });
    }
    
  }

  /**
   * Show key creation modal
   */
  showKeyCreationModal(type) {
    const modal = document.getElementById('key-creation-modal');
    const title = document.getElementById('modal-title');
    const readerKeyInput = document.getElementById('reader-key-input');
    const privateKeyInput = document.getElementById('private-key');

    if (type === 'writer') {
      title.textContent = 'Create Writer Key';
      readerKeyInput.style.display = 'none';
      privateKeyInput.required = false;
    } else {
      title.textContent = 'Add Reader Key';
      readerKeyInput.style.display = 'block';
      privateKeyInput.required = true;
      
      // Hide the key name input for reader keys since it comes from JSON
      const keyNameInput = document.getElementById('key-name');
      keyNameInput.style.display = 'none';
      keyNameInput.required = false;
    }

    // Store the key type for form submission
    modal.dataset.keyType = type;
    this.showModal('key-creation-modal');
    
    // Simple auto-focus for reader keys
    if (type === 'reader') {
      setTimeout(() => {
        const privateKeyInput = document.getElementById('private-key');
        if (privateKeyInput) {
          privateKeyInput.focus();
        }
      }, 100);
    }
  }


  /**
   * Copy private key for a specific writer key
   */
  async copyPrivateKey(writerKeyId) {
    try {
      console.log('Asocial Extension: Copying private key for writer key:', writerKeyId);
      
      // Get the private key for this writer key
      const getPrivateKeyResult = await chrome.runtime.sendMessage({
        action: 'getWriterKeyPrivateKey',
        writerKeyId: writerKeyId
      });

        if (getPrivateKeyResult.success) {
          // Copy the export data as JSON to clipboard
          const exportData = getPrivateKeyResult.exportData;
          const jsonString = JSON.stringify(exportData, null, 2);
          
          try {
            await navigator.clipboard.writeText(jsonString);
            this.showNotification('Reader key exported to clipboard! Share this JSON with people who need to decrypt your messages.', 'success');
          } catch (clipboardError) {
            // Fallback: show the JSON in a prompt if clipboard fails
            prompt(`Reader Key Export (JSON):\n\n${jsonString}\n\nCopy this JSON and give it to people who need to decrypt your messages.`);
          }
        } else {
          this.showNotification('Failed to get private key: ' + getPrivateKeyResult.error, 'error');
        }
    } catch (error) {
      console.error('Asocial Extension: Error copying private key:', error);
      this.showNotification('Error copying private key', 'error');
    }
  }

  /**
   * Handle key creation
   */
  async handleKeyCreation() {
    try {
      const modal = document.getElementById('key-creation-modal');
      const keyType = modal.dataset.keyType;
      const name = document.getElementById('key-name').value;

      if (keyType === 'writer' && !name.trim()) {
        this.showNotification('Key name is required', 'error');
        return;
      }

      if (keyType === 'writer') {
        // Create writer key
        const result = await chrome.runtime.sendMessage({
          action: 'createWriterKey',
          name: name.trim()
        });

        if (result.success) {
          this.showNotification('Writer key created successfully!', 'success');
          this.hideModal('key-creation-modal');
          this.loadWriterKeys();
        } else {
          this.showNotification(result.error || 'Failed to create writer key', 'error');
        }
      } else {
        // Add reader key
        const privateKey = document.getElementById('private-key').value;

        if (!privateKey.trim()) {
          this.showNotification('Private key is required', 'error');
          return;
        }

        // Check if it's JSON format (exported reader key)
        let importName = 'Imported Reader Key'; // Default name
        let importData = privateKey.trim();
        
        try {
          const jsonData = JSON.parse(privateKey.trim());
          if (jsonData.name && jsonData.privateKey) {
            // It's a JSON export, use the name from it
            importName = jsonData.name;
            importData = privateKey.trim(); // Use the full JSON
            console.log('Asocial Extension: Importing from JSON export');
          } else {
            throw new Error('Invalid JSON format');
          }
        } catch (jsonError) {
          // Not JSON, use default name and raw private key
          console.log('Asocial Extension: Importing as raw private key');
          importData = privateKey.trim(); // Use raw private key
        }

        const result = await chrome.runtime.sendMessage({
          action: 'addReaderKey',
          name: importName,
          privateKey: importData
        });

        if (result.success) {
          this.showNotification('Reader key added successfully!', 'success');
          this.hideModal('key-creation-modal');
          this.loadReaderKeys();
        } else {
          this.showNotification(result.error || 'Failed to add reader key', 'error');
        }
      }

      // Clear form
      document.getElementById('key-creation-form').reset();
    } catch (error) {
      console.error('Asocial Popup: Error creating key:', error);
      this.showNotification('Failed to create key', 'error');
    }
  }

  /**
   * Delete key
   */
  async deleteKey(keyId) {
    try {
      if (!confirm('Are you sure you want to delete this key?')) {
        return;
      }

      const result = await chrome.runtime.sendMessage({
        action: 'deleteKey',
        keyId: keyId
      });

      if (result.success) {
        this.showNotification('Key deleted successfully!', 'success');
        this.loadWriterKeys();
        this.loadReaderKeys();
      } else {
        this.showNotification(result.error || 'Failed to delete key', 'error');
      }
    } catch (error) {
      console.error('Asocial Popup: Error deleting key:', error);
      this.showNotification('Failed to delete key', 'error');
    }
  }

  /**
   * Handle KeyStore import
   */
  async handleKeyStoreImport() {
    try {
      const fileInput = document.getElementById('import-file');

      if (!fileInput.files[0]) {
        this.showNotification('Please select a KeyStore file', 'error');
        return;
      }

      // Read the file content
      const file = fileInput.files[0];
      const fileContent = await this.readFileAsText(file);
      
      // Parse the JSON
      let keyStoreData;
      try {
        keyStoreData = JSON.parse(fileContent);
      } catch (parseError) {
        this.showNotification('Invalid KeyStore file format', 'error');
        return;
      }

      // Send to background for import
      const result = await chrome.runtime.sendMessage({
        action: 'importKeyStore',
        keyStoreData: keyStoreData
      });

      if (result.success) {
        this.showNotification('KeyStore imported successfully!', 'success');
        this.hideModal('import-modal');
        this.loadKeyStoreList(); // Refresh the KeyStore list
      } else {
        this.showNotification('Failed to import KeyStore: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Asocial Popup: Error importing KeyStore:', error);
      this.showNotification('Failed to import KeyStore', 'error');
    }
  }

  /**
   * Read file as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Export KeyStore
   */
  async exportKeyStore(keyStoreId) {
    try {
      // Get the encrypted KeyStore data from storage (no decryption needed)
      const result = await chrome.runtime.sendMessage({
        action: 'exportKeyStoreData',
        keyStoreId: keyStoreId
      });

      if (result.success) {
        // Create and download the file
        const blob = new Blob([result.keyStoreData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keystore_${keyStoreId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('KeyStore exported successfully!', 'success');
      } else {
        this.showNotification('Failed to export KeyStore: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Asocial Popup: Error exporting KeyStore:', error);
      this.showNotification('Failed to export KeyStore', 'error');
    }
  }


  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
function initializeExtension() {
  try {
    console.log('Asocial Extension: initializeExtension function called');
    
    // Check if all required elements exist
    const requiredElements = [
      'keystore-selection-panel',
      'keystore-creation-panel', 
      'keystore-auth-panel',
      'key-management-panel'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
      console.error('Asocial Extension: Missing required elements:', missingElements);
      return;
    }
    
    console.log('Asocial Extension: Creating new AsocialExtension instance');
    window.asocialExtension = new AsocialExtension();
  } catch (error) {
    console.error('Asocial Extension: Initialization error:', error);
  }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  // DOM is already loaded
  setTimeout(initializeExtension, 100);
}

// Test if extension script is loading
console.log('Asocial Extension: Script loaded successfully');
