/**
 * Asocial Popup JavaScript
 * Handles key management and user interface
 */

class AsocialPopup {
  constructor() {
    this.keyManager = new AsocialKeyManager();
    this.crypto = new AsocialCrypto();
    this.currentMode = 'simple';
    this.currentWriterKeyId = null;
    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    console.log('Initializing Asocial popup');
    
    try {
      // Force popup size
      this.forcePopupSize();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadWriterKeys();
      await this.loadReaderKeys();
      
      // Setup mode switching
      this.setupModeSwitching();
      
      console.log('Popup initialized successfully');
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showStatus('Failed to initialize popup', 'error');
    }
  }

  /**
   * Force popup size to be usable
   */
  forcePopupSize() {
    // Set body and container size
    document.body.style.width = '600px';
    document.body.style.minWidth = '600px';
    document.body.style.maxWidth = '600px';
    
    const container = document.querySelector('.popup-container');
    if (container) {
      container.style.width = '600px';
      container.style.minWidth = '600px';
      container.style.maxWidth = '600px';
    }
    
    console.log('Forced popup size to 600px');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    try {
    // Mode switching
      const simpleMode = document.getElementById('simple-mode');
      const advancedMode = document.getElementById('advanced-mode');
      if (simpleMode) simpleMode.addEventListener('click', () => this.switchMode('simple'));
      if (advancedMode) advancedMode.addEventListener('click', () => this.switchMode('advanced'));
    
    // Quick actions
      const createGroupBtn = document.getElementById('create-group-btn');
      const importKeyBtn = document.getElementById('import-key-btn');
      const setUsernameBtn = document.getElementById('set-username-btn');
      if (createGroupBtn) createGroupBtn.addEventListener('click', () => this.showCreateWriterKeyModal());
      if (importKeyBtn) importKeyBtn.addEventListener('click', () => this.showImportKeyModal());
      if (setUsernameBtn) setUsernameBtn.addEventListener('click', () => this.showUsernameModal());
    
    // Create group modal
      const createGroup = document.getElementById('create-group');
      const cancelCreate = document.getElementById('cancel-create');
      if (createGroup) createGroup.addEventListener('click', () => this.createWriterKey());
      if (cancelCreate) cancelCreate.addEventListener('click', () => this.hideModal('create-group-modal'));
    
    // Import key modal
      const importKey = document.getElementById('import-key');
      const cancelImport = document.getElementById('cancel-import');
      if (importKey) importKey.addEventListener('click', () => this.importKey());
      if (cancelImport) cancelImport.addEventListener('click', () => this.hideModal('import-key-modal'));
      
      // Username modal
      const saveUsername = document.getElementById('save-username');
      const cancelUsername = document.querySelector('[data-modal="username-modal"]');
      if (saveUsername) saveUsername.addEventListener('click', () => this.saveUsername());
      if (cancelUsername) cancelUsername.addEventListener('click', () => this.hideModal('username-modal'));
    
    // Import tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchImportTab(e.target.dataset.tab));
    });
    
    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.hideModal(modal.id);
      });
    });
    
    // Advanced mode settings
      const exportAllKeys = document.getElementById('export-all-keys');
      const importKeys = document.getElementById('import-keys');
      const backupKeys = document.getElementById('backup-keys');
      const restoreKeys = document.getElementById('restore-keys');
      if (exportAllKeys) exportAllKeys.addEventListener('click', () => this.exportAllKeys());
      if (importKeys) importKeys.addEventListener('click', () => this.showImportKeyModal());
      if (backupKeys) backupKeys.addEventListener('click', () => this.backupKeys());
      if (restoreKeys) restoreKeys.addEventListener('click', () => this.restoreKeys());
      
      console.log('Event listeners setup successfully');
    } catch (error) {
      console.error('Failed to setup event listeners:', error);
    }
  }

  /**
   * Setup mode switching
   */
  setupModeSwitching() {
    const simpleMode = document.getElementById('simple-mode');
    const advancedMode = document.getElementById('advanced-mode');
    const simpleContent = document.getElementById('simple-mode-content');
    const advancedContent = document.getElementById('advanced-mode-content');
    
    simpleMode.addEventListener('click', () => {
      simpleMode.classList.add('active');
      advancedMode.classList.remove('active');
      simpleContent.classList.add('active');
      advancedContent.classList.remove('active');
      this.currentMode = 'simple';
    });
    
    advancedMode.addEventListener('click', () => {
      advancedMode.classList.add('active');
      simpleMode.classList.remove('active');
      advancedContent.classList.add('active');
      simpleContent.classList.remove('active');
      this.currentMode = 'advanced';
    });
  }

  /**
   * Load and display writer keys
   */
  async loadWriterKeys() {
    try {
      const writerKeys = await this.keyManager.getKeyGroups();
      this.displayWriterKeys(writerKeys);
    } catch (error) {
      console.error('Failed to load writer keys:', error);
      this.showStatus('Failed to load writer keys', 'error');
    }
  }

  /**
   * Load and display reader keys
   */
  async loadReaderKeys() {
    try {
      const readerKeys = await this.keyManager.getReaderKeys();
      this.displayReaderKeys(readerKeys);
    } catch (error) {
      console.error('Failed to load reader keys:', error);
      this.showStatus('Failed to load reader keys', 'error');
    }
  }

  /**
   * Display writer keys in the UI
   */
  displayWriterKeys(writerKeys) {
    const writerKeysList = document.getElementById('groups-list');
    
      if (writerKeys.length === 0) {
        writerKeysList.innerHTML = `
        <div class="empty-state">
            <p>No writer keys yet.</p>
            <p>Create your first writer key to start encrypting posts!</p>
        </div>
      `;
      return;
    }
    
    writerKeysList.innerHTML = writerKeys.map(writerKey => `
      <div class="writer-key-item" data-writer-key-id="${writerKey.id}">
        <div class="writer-key-info">
          <div class="writer-key-name">${writerKey.name}</div>
          <div class="writer-key-asocial">Asocial: ${writerKey.asocialUsername || 'Unknown'}</div>
        </div>
        <div class="writer-key-meta">
          <span class="writer-key-created">Created: ${new Date(writerKey.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
    
    // Add click handlers for writer key items
    document.querySelectorAll('.writer-key-item').forEach(item => {
      item.addEventListener('click', () => this.showWriterKeyDetails(item.dataset.writerKeyId));
    });
  }

  /**
   * Display reader keys in the UI
   */
  displayReaderKeys(readerKeys) {
    const readerKeysList = document.getElementById('reader-keys-list');
    
      if (readerKeys.length === 0) {
        readerKeysList.innerHTML = `
          <div class="empty-state">
            <p>No reader keys imported yet.</p>
            <p>Import someone's reader key to decrypt their messages!</p>
          </div>
        `;
        return;
      }
    
    readerKeysList.innerHTML = readerKeys.map(readerKey => `
      <div class="reader-key-item" data-reader-key-id="${readerKey.id}">
        <div class="reader-key-info">
          <div class="reader-key-name">${readerKey.senderName}</div>
          <div class="reader-key-asocial">Asocial: ${readerKey.asocialUsername || readerKey.senderName}</div>
        </div>
        <div class="reader-key-meta">
          <span class="reader-key-id">Key ID: ${readerKey.keyId || 'Unknown'}</span>
        </div>
        <div class="reader-key-actions">
          <button class="delete-reader-key" title="Delete reader key">🗑️</button>
        </div>
      </div>
    `).join('');
    
    // Add click handlers for reader key items
    document.querySelectorAll('.reader-key-item').forEach(item => {
      const deleteBtn = item.querySelector('.delete-reader-key');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteReaderKey(item.dataset.readerKeyId);
      });
    });
  }

  /**
   * Show create writer key modal
   */
  showCreateWriterKeyModal() {
    document.getElementById('create-group-modal').classList.add('active');
    document.getElementById('group-name').focus();
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  /**
   * Create new writer key
   */
  async createWriterKey() {
    try {
      const writerKeyName = document.getElementById('group-name').value.trim();
      const description = document.getElementById('group-description').value.trim();
      
      // Validate writer key name
      const validation = this.keyManager.validateGroupName(writerKeyName);
      if (!validation.valid) {
        this.showStatus(validation.error, 'error');
        return;
      }
      
      // Create writer key
      const writerKey = await this.keyManager.createKeyGroup(writerKeyName);
      
      // Add description if provided
      if (description) {
        writerKey.description = description;
        await this.keyManager.storeKeyGroups(await this.keyManager.getKeyGroups());
      }
      
      
      this.hideModal('create-group-modal');
      this.showStatus(`Writer key "${writerKeyName}" created successfully!`, 'success');
      
      // Clear form
      document.getElementById('group-name').value = '';
      document.getElementById('group-description').value = '';
      
      // Reload writer keys
      await this.loadWriterKeys();
      
    } catch (error) {
      console.error('Failed to create writer key:', error);
      this.showStatus(`Failed to create writer key: ${error.message}`, 'error');
    }
  }


  /**
   * Show import key modal
   */
  showImportKeyModal() {
    document.getElementById('import-key-modal').classList.add('active');
    this.switchImportTab('paste');
  }

  /**
   * Show username modal
   */
  showUsernameModal() {
    document.getElementById('username-modal').classList.add('active');
    this.loadCurrentUsername();
  }

  /**
   * Load current username into modal
   */
  async loadCurrentUsername() {
    try {
      const username = await this.keyManager.getStoredUsername();
      if (username) {
        document.getElementById('asocial-username').value = username;
      }
    } catch (error) {
      console.error('Failed to load current username:', error);
    }
  }

  /**
   * Save username
   */
  async saveUsername() {
    try {
      const username = document.getElementById('asocial-username').value.trim();
      
      if (!username) {
        this.showStatus('Please enter a username', 'error');
        return;
      }
      
      if (username.length < 2) {
        this.showStatus('Username must be at least 2 characters long', 'error');
        return;
      }
      
      if (username.length > 50) {
        this.showStatus('Username must be less than 50 characters', 'error');
        return;
      }
      
      await this.keyManager.setAsocialUsername(username);
      this.hideModal('username-modal');
      this.showStatus(`Asocial username set to: ${username}`, 'success');
      
    } catch (error) {
      console.error('Failed to save username:', error);
      this.showStatus(`Failed to save username: ${error.message}`, 'error');
    }
  }

  /**
   * Switch import tab
   */
  switchImportTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  /**
   * Import key
   */
  async importKey() {
    try {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      
      let keyData;
      
      switch (activeTab) {
        case 'paste':
          keyData = document.getElementById('pasted-key').value.trim();
          break;
          
        case 'qr':
          // QR code scanning would be implemented here
          this.showStatus('QR code scanning coming soon!', 'info');
          return;
          
        case 'file':
          const fileInput = document.getElementById('key-file');
          if (!fileInput.files[0]) {
            this.showStatus('Please select a key file', 'error');
            return;
          }
          const fileContent = await this.readFileAsText(fileInput.files[0]);
          keyData = fileContent;
          break;
      }
      
      if (!keyData) {
        this.showStatus('Please provide a key', 'error');
        return;
      }
      
      // Import the reader key (other person's private key for decrypting their messages)
      // This is independent of groups - you can import reader keys without having any groups
      const readerKey = await this.keyManager.importReaderKey(keyData);
      
      this.hideModal('import-key-modal');
      this.showStatus(`Reader key imported for ${readerKey.senderName}! You can now decrypt their messages.`, 'success');
      
      // Clear form
      document.getElementById('pasted-key').value = '';
      document.getElementById('key-file').value = '';
      
      // Reload writer keys and reader keys
      await this.loadWriterKeys();
      await this.loadReaderKeys();
      
    } catch (error) {
      console.error('Failed to import key:', error);
      this.showStatus(`Failed to import key: ${error.message}`, 'error');
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
   * Show writer key details
   */
  async showWriterKeyDetails(writerKeyId) {
    try {
      const writerKey = await this.keyManager.getKeyGroup(writerKeyId);
      if (!writerKey) {
        this.showStatus('Writer key not found', 'error');
        return;
      }
      
      // Populate writer key details
      document.getElementById('group-details-title').textContent = writerKey.name;
      document.getElementById('group-details-name').textContent = writerKey.name;
      document.getElementById('group-details-created').textContent = new Date(writerKey.createdAt).toLocaleString();
      
      // Setup writer key actions
      document.getElementById('export-group-key').onclick = () => this.exportWriterKey(writerKeyId);
      document.getElementById('delete-group').onclick = () => this.deleteWriterKey(writerKeyId);
      
      this.currentWriterKeyId = writerKeyId;
      document.getElementById('group-details-modal').classList.add('active');
      
    } catch (error) {
      console.error('Failed to show writer key details:', error);
      this.showStatus('Failed to load writer key details', 'error');
    }
  }

  /**
   * Export writer key
   */
  async exportWriterKey(writerKeyId) {
    try {
      // Check if username is set
      const isUsernameSet = await this.keyManager.isUsernameSet();
      if (!isUsernameSet) {
        this.showStatus('Please set your Asocial username first!', 'error');
        this.showUsernameModal();
        return;
      }
      
      const keyData = await this.keyManager.exportGroupPublicKey(writerKeyId);
      
      // Create JSON format with key ID for sharing
      const exportData = {
        privateKey: keyData.privateKey,
        keyId: keyData.keyId,
        groupName: keyData.groupName,
        asocialUsername: keyData.asocialUsername,
        createdAt: keyData.createdAt
      };
      
      // Copy to clipboard as JSON
      await navigator.clipboard.writeText(JSON.stringify(exportData));
      this.showStatus('Writer key with key ID copied to clipboard!', 'success');
      
    } catch (error) {
      console.error('Failed to export writer key:', error);
      this.showStatus('Failed to export key', 'error');
    }
  }


  /**
   * Delete writer key
   */
  async deleteWriterKey(writerKeyId) {
    if (!confirm('Delete this writer key? This action cannot be undone.')) return;
    
    try {
      await this.keyManager.deleteKeyGroup(writerKeyId);
      this.hideModal('group-details-modal');
      this.showStatus('Writer key deleted!', 'success');
      await this.loadWriterKeys(); // Refresh
    } catch (error) {
      console.error('Failed to delete writer key:', error);
      this.showStatus('Failed to delete writer key', 'error');
    }
  }

  /**
   * Delete reader key
   */
  async deleteReaderKey(readerKeyId) {
    if (!confirm('Delete this reader key? You will no longer be able to decrypt messages from this sender.')) return;
    
    try {
      await this.keyManager.deleteReaderKey(readerKeyId);
      this.showStatus('Reader key deleted!', 'success');
      await this.loadReaderKeys(); // Refresh
    } catch (error) {
      console.error('Failed to delete reader key:', error);
      this.showStatus('Failed to delete reader key', 'error');
    }
  }

  /**
   * Export all keys
   */
  async exportAllKeys() {
    try {
      const writerKeys = await this.keyManager.getKeyGroups();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        writerKeys: writerKeys.map(writerKey => ({
          name: writerKey.name,
          publicKey: writerKey.publicKey,
        }))
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `asocial-keys-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      this.showStatus('Keys exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export keys:', error);
      this.showStatus('Failed to export keys', 'error');
    }
  }

  /**
   * Backup keys
   */
  async backupKeys() {
    this.showStatus('Backup functionality coming soon!', 'info');
  }

  /**
   * Restore keys
   */
  async restoreKeys() {
    this.showStatus('Restore functionality coming soon!', 'info');
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new AsocialPopup();
});
