/**
 * Asocial Popup JavaScript
 * Handles key management and user interface
 */

class AsocialPopup {
  constructor() {
    this.keyManager = new AsocialKeyManager();
    this.crypto = new AsocialCrypto();
    this.currentMode = 'simple';
    this.currentGroupId = null;
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
      await this.loadGroups();
      
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
    // Mode switching
    document.getElementById('simple-mode').addEventListener('click', () => this.switchMode('simple'));
    document.getElementById('advanced-mode').addEventListener('click', () => this.switchMode('advanced'));
    
    // Quick actions
    document.getElementById('create-group-btn').addEventListener('click', () => this.showCreateGroupModal());
    document.getElementById('import-key-btn').addEventListener('click', () => this.showImportKeyModal());
    
    // Create group modal
    document.getElementById('create-group').addEventListener('click', () => this.createGroup());
    document.getElementById('cancel-create').addEventListener('click', () => this.hideModal('create-group-modal'));
    
    // Import key modal
    document.getElementById('import-key').addEventListener('click', () => this.importKey());
    document.getElementById('cancel-import').addEventListener('click', () => this.hideModal('import-key-modal'));
    
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
    document.getElementById('export-all-keys').addEventListener('click', () => this.exportAllKeys());
    document.getElementById('import-keys').addEventListener('click', () => this.showImportKeyModal());
    document.getElementById('backup-keys').addEventListener('click', () => this.backupKeys());
    document.getElementById('restore-keys').addEventListener('click', () => this.restoreKeys());
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
   * Load and display groups
   */
  async loadGroups() {
    try {
      const groups = await this.keyManager.getKeyGroups();
      this.displayGroups(groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      this.showStatus('Failed to load groups', 'error');
    }
  }

  /**
   * Display groups in the UI
   */
  displayGroups(groups) {
    const groupsList = document.getElementById('groups-list');
    
    if (groups.length === 0) {
      groupsList.innerHTML = `
        <div class="empty-state">
          <p>No encryption groups yet.</p>
          <p>Create your first group to start encrypting posts!</p>
        </div>
      `;
      return;
    }
    
    groupsList.innerHTML = groups.map(group => `
      <div class="group-item" data-group-id="${group.id}">
        <div class="group-name">${group.name}</div>
        <div class="group-meta">
          <span class="group-contacts">${group.contacts.length} contacts</span>
          <span class="group-created">${new Date(group.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
    
    // Add click handlers for group items
    document.querySelectorAll('.group-item').forEach(item => {
      item.addEventListener('click', () => this.showGroupDetails(item.dataset.groupId));
    });
  }

  /**
   * Show create group modal
   */
  showCreateGroupModal() {
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
   * Create new group
   */
  async createGroup() {
    try {
      const groupName = document.getElementById('group-name').value.trim();
      const description = document.getElementById('group-description').value.trim();
      
      // Validate group name
      const validation = this.keyManager.validateGroupName(groupName);
      if (!validation.valid) {
        this.showStatus(validation.error, 'error');
        return;
      }
      
      // Create group
      const group = await this.keyManager.createKeyGroup(groupName);
      
      // Add description if provided
      if (description) {
        group.description = description;
        await this.keyManager.storeKeyGroups(await this.keyManager.getKeyGroups());
      }
      
      
      this.hideModal('create-group-modal');
      this.showStatus(`Group "${groupName}" created successfully!`, 'success');
      
      // Clear form
      document.getElementById('group-name').value = '';
      document.getElementById('group-description').value = '';
      
      // Reload groups
      await this.loadGroups();
      
    } catch (error) {
      console.error('Failed to create group:', error);
      this.showStatus(`Failed to create group: ${error.message}`, 'error');
    }
  }

  /**
   * Auto-add sample contacts to group for testing
   */
  async autoAddLinkedInContacts(groupId) {
    try {
      // Add some sample contacts for testing
      const sampleContacts = [
        { name: 'Alice Johnson', publicKey: 'sample-key-alice' },
        { name: 'Bob Smith', publicKey: 'sample-key-bob' },
        { name: 'Carol Davis', publicKey: 'sample-key-carol' }
      ];
      
      for (const contact of sampleContacts) {
        await this.keyManager.addContactToGroup(groupId, contact.name, contact.publicKey);
      }
      
      this.showStatus(`Added ${sampleContacts.length} sample contacts for testing!`, 'success');
    } catch (error) {
      console.error('Failed to add sample contacts:', error);
      this.showStatus('Failed to add sample contacts', 'error');
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
      
      let keyData, contactName;
      
      switch (activeTab) {
        case 'paste':
          keyData = document.getElementById('pasted-key').value.trim();
          contactName = document.getElementById('contact-name').value.trim();
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
          contactName = fileInput.files[0].name.replace(/\.[^/.]+$/, '');
          break;
      }
      
      if (!keyData) {
        this.showStatus('Please provide a key', 'error');
        return;
      }
      
      if (!contactName) {
        this.showStatus('Please provide a contact name', 'error');
        return;
      }
      
      // Import the key (single shared key for the group)
      const importData = await this.keyManager.importGroupPublicKey(keyData, contactName);
      
      // Get available groups
      const groups = await this.keyManager.getKeyGroups();
      if (groups.length === 0) {
        this.showStatus('Please create a group first', 'error');
        return;
      }
      
      // For now, update the first group (in the future, we could show a group selection)
      const groupId = groups[0].id;
      const groupName = groups[0].name;
      console.log(`Attempting to update group "${groupName}" (${groupId}) with imported key`);
      
      try {
        await this.keyManager.updateGroupPublicKey(groupId, importData.publicKey, importData);
        console.log('Successfully updated group private key');
        this.showStatus(`Updated private key for group: ${groupName}`, 'success');
      } catch (error) {
        console.error('Failed to update group private key:', error);
        this.showStatus(`Failed to update group "${groupName}": ${error.message}`, 'error');
        return;
      }
      
      // Add contact with just the name (no individual key needed)
      await this.keyManager.addContactToGroup(groupId, contactName);
      
      this.hideModal('import-key-modal');
      this.showStatus(`Key imported for ${contactName}!`, 'success');
      
      // Clear form
      document.getElementById('pasted-key').value = '';
      document.getElementById('contact-name').value = '';
      document.getElementById('key-file').value = '';
      
      // Reload groups
      await this.loadGroups();
      
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
   * Show group details
   */
  async showGroupDetails(groupId) {
    try {
      const group = await this.keyManager.getKeyGroup(groupId);
      if (!group) {
        this.showStatus('Group not found', 'error');
        return;
      }
      
      // Populate group details
      document.getElementById('group-details-title').textContent = group.name;
      document.getElementById('group-details-name').textContent = group.name;
      document.getElementById('group-details-created').textContent = new Date(group.createdAt).toLocaleString();
      document.getElementById('group-details-contacts').textContent = group.contacts.length;
      
      // Populate contacts list
      const contactsList = document.getElementById('contacts-list');
      if (group.contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-state">No contacts in this group</div>';
      } else {
        contactsList.innerHTML = group.contacts.map(contact => `
          <div class="contact-item">
            <span class="contact-name">${contact.name}</span>
            <div class="contact-actions">
              <button onclick="popup.removeContact('${groupId}', '${contact.id}')" title="Remove contact">🗑️</button>
            </div>
          </div>
        `).join('');
      }
      
      // Setup group actions
      document.getElementById('export-group-key').onclick = () => this.exportGroupKey(groupId);
      document.getElementById('add-contact').onclick = () => this.addContactToGroup(groupId);
      document.getElementById('delete-group').onclick = () => this.deleteGroup(groupId);
      
      this.currentGroupId = groupId;
      document.getElementById('group-details-modal').classList.add('active');
      
    } catch (error) {
      console.error('Failed to show group details:', error);
      this.showStatus('Failed to load group details', 'error');
    }
  }

  /**
   * Export group public key
   */
  async exportGroupKey(groupId) {
    try {
      const keyData = await this.keyManager.exportGroupPublicKey(groupId);
      
      // Create JSON format with key ID for sharing
      const exportData = {
        privateKey: keyData.privateKey,
        keyId: keyData.keyId,
        groupName: keyData.groupName
      };
      
      // Copy to clipboard as JSON
      await navigator.clipboard.writeText(JSON.stringify(exportData));
      this.showStatus('Private key with key ID copied to clipboard!', 'success');
      
    } catch (error) {
      console.error('Failed to export group key:', error);
      this.showStatus('Failed to export key', 'error');
    }
  }

  /**
   * Add contact to group (just name, no individual key needed)
   */
  async addContactToGroup(groupId) {
    const contactName = prompt('Enter contact name:');
    if (!contactName) return;
    
    try {
      await this.keyManager.addContactToGroup(groupId, contactName);
      this.showStatus(`Contact ${contactName} added!`, 'success');
      this.showGroupDetails(groupId); // Refresh
    } catch (error) {
      console.error('Failed to add contact:', error);
      this.showStatus('Failed to add contact', 'error');
    }
  }

  /**
   * Remove contact from group
   */
  async removeContact(groupId, contactId) {
    if (!confirm('Remove this contact from the group?')) return;
    
    try {
      await this.keyManager.removeContactFromGroup(groupId, contactId);
      this.showStatus('Contact removed!', 'success');
      this.showGroupDetails(groupId); // Refresh
    } catch (error) {
      console.error('Failed to remove contact:', error);
      this.showStatus('Failed to remove contact', 'error');
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId) {
    if (!confirm('Delete this group? This action cannot be undone.')) return;
    
    try {
      await this.keyManager.deleteKeyGroup(groupId);
      this.hideModal('group-details-modal');
      this.showStatus('Group deleted!', 'success');
      await this.loadGroups(); // Refresh
    } catch (error) {
      console.error('Failed to delete group:', error);
      this.showStatus('Failed to delete group', 'error');
    }
  }

  /**
   * Export all keys
   */
  async exportAllKeys() {
    try {
      const groups = await this.keyManager.getKeyGroups();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        groups: groups.map(group => ({
          name: group.name,
          publicKey: group.publicKey,
          contacts: group.contacts
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
