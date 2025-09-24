/**
 * Asocial Background Service Worker
 * Handles extension lifecycle and communication
 */

class AsocialBackground {
  constructor() {
    this.init();
  }

  /**
   * Initialize background service
   */
  init() {
    console.log('Asocial background service worker initialized');
    
    // Setup extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });
    
    // Setup message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
    
    // Setup storage change handling
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
    
    // Setup tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
    
    // Setup context menu
    this.setupContextMenu();
  }

  /**
   * Setup context menu
   */
  setupContextMenu() {
    // Create main context menu item
    chrome.contextMenus.create({
      id: 'asocial-encrypt',
      title: 'Encrypt with Asocial',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>']
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'asocial-encrypt') {
        this.handleContextMenuClick(info, tab);
      }
    });
  }

  /**
   * Handle context menu click
   */
  handleContextMenuClick(info, tab) {
    // Send message to content script to show encryption modal
    chrome.tabs.sendMessage(tab.id, {
      action: 'showEncryptionModal',
      selectedText: info.selectionText
    }).catch(error => {
      console.error('Failed to send message to content script:', error);
    });
  }

  /**
   * Handle extension installation
   */
  handleInstallation(details) {
    console.log('Extension installed/updated:', details);
    
    if (details.reason === 'install') {
      // First time installation
      this.setupDefaultSettings();
      this.showWelcomeNotification();
    } else if (details.reason === 'update') {
      // Extension updated
      this.handleUpdate(details.previousVersion);
    }
  }

  /**
   * Setup default settings
   */
  async setupDefaultSettings() {
    try {
      const defaultSettings = {
        asocial_settings: {
          mode: 'simple',
          algorithm: 'RSA-4096',
          hashAlgorithm: 'SHA-512',
          autoLock: true,
          clearClipboard: true,
          notifications: true,
          theme: 'auto'
        },
        asocial_groups: [],
        asocial_keys: {},
        asocial_version: '1.0.0'
      };
      
      await chrome.storage.local.set(defaultSettings);
      console.log('Default settings initialized');
    } catch (error) {
      console.error('Failed to setup default settings:', error);
    }
  }

  /**
   * Show welcome notification
   */
  showWelcomeNotification() {
    try {
      // Temporarily disable notifications to avoid icon issues
      console.log('BE ASOCIAL! Your posts can now be encrypted for specific groups.');
    } catch (error) {
      console.log('BE ASOCIAL! Your posts can now be encrypted for specific groups.');
    }
  }

  /**
   * Handle extension update
   */
  async handleUpdate(previousVersion) {
    console.log(`Extension updated from ${previousVersion} to 1.0.0`);
    
    // Migrate settings if needed
    await this.migrateSettings(previousVersion);
    
    // Show update notification
    try {
      // Temporarily disable notifications to avoid icon issues
      console.log('BE ASOCIAL Updated! New features and improvements are available.');
    } catch (error) {
      console.log('BE ASOCIAL Updated! New features and improvements are available.');
    }
  }

  /**
   * Migrate settings from previous version
   */
  async migrateSettings(previousVersion) {
    try {
      const currentData = await chrome.storage.local.get(null);
      
      // Add any migration logic here based on previous version
      if (previousVersion && previousVersion < '1.0.0') {
        // Example: Migrate old key format to new format
        if (currentData.asocial_keys && !currentData.asocial_groups) {
          // Convert old key format to new group format
          console.log('Migrating from old key format to group format');
        }
      }
      
      console.log('Settings migration completed');
    } catch (error) {
      console.error('Failed to migrate settings:', error);
    }
  }

  /**
   * Handle messages from content scripts and popup
   */
  handleMessage(message, sender, sendResponse) {
    console.log('Background received message:', message);
    
    switch (message.type) {
      case 'GET_GROUPS':
        this.getGroups(sendResponse);
        return true; // Keep message channel open for async response
        
      case 'CREATE_GROUP':
        this.createGroup(message.data, sendResponse);
        return true;
        
      case 'ENCRYPT_MESSAGE':
        this.encryptMessage(message.data, sendResponse);
        return true;
        
      case 'DECRYPT_MESSAGE':
        this.decryptMessage(message.data, sendResponse);
        return true;
        
      case 'GET_SETTINGS':
        this.getSettings(sendResponse);
        return true;
        
      case 'UPDATE_SETTINGS':
        this.updateSettings(message.data, sendResponse);
        return true;
        
      case 'EXPORT_KEYS':
        this.exportKeys(sendResponse);
        return true;
        
      case 'IMPORT_KEYS':
        this.importKeys(message.data, sendResponse);
        return true;
        
      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  /**
   * Get encryption groups
   */
  async getGroups(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['asocial_groups']);
      const groups = result.asocial_groups || [];
      sendResponse({ success: true, data: groups });
    } catch (error) {
      console.error('Failed to get groups:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Create new encryption group
   */
  async createGroup(data, sendResponse) {
    try {
      const { name, description } = data;
      
      // Validate input
      if (!name || name.trim().length === 0) {
        sendResponse({ success: false, error: 'Group name is required' });
        return;
      }
      
      // Create group (this would integrate with the key manager)
      const group = {
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description || '',
        createdAt: new Date().toISOString(),
      };
      
      // Store group
      const result = await chrome.storage.local.get(['asocial_groups']);
      const groups = result.asocial_groups || [];
      groups.push(group);
      await chrome.storage.local.set({ asocial_groups: groups });
      
      sendResponse({ success: true, data: group });
    } catch (error) {
      console.error('Failed to create group:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Encrypt message
   */
  async encryptMessage(data, sendResponse) {
    try {
      const { message, groupId } = data;
      
      if (!message || !groupId) {
        sendResponse({ success: false, error: 'Message and group ID are required' });
        return;
      }
      
      // This would integrate with the encryption engine
      // For now, return a placeholder
      const encryptedMessage = `[ASOCIAL MESSAGE] ${btoa(JSON.stringify({
        message: message,
        groupId: groupId,
        timestamp: new Date().toISOString()
      }))}`;
      
      sendResponse({ success: true, data: { encryptedMessage } });
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Decrypt message
   */
  async decryptMessage(data, sendResponse) {
    try {
      const { encryptedMessage } = data;
      
      if (!encryptedMessage) {
        sendResponse({ success: false, error: 'Encrypted message is required' });
        return;
      }
      
      // This would integrate with the encryption engine
      // For now, return a placeholder
      try {
        const payload = JSON.parse(atob(encryptedMessage.replace('[ASOCIAL MESSAGE] ', '')));
        sendResponse({ success: true, data: { decryptedMessage: payload.message } });
      } catch (error) {
        sendResponse({ success: false, error: 'Invalid encrypted message format' });
      }
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Get extension settings
   */
  async getSettings(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['asocial_settings']);
      const settings = result.asocial_settings || {};
      sendResponse({ success: true, data: settings });
    } catch (error) {
      console.error('Failed to get settings:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Update extension settings
   */
  async updateSettings(data, sendResponse) {
    try {
      await chrome.storage.local.set({ asocial_settings: data });
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to update settings:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Export keys
   */
  async exportKeys(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['asocial_groups']);
      const groups = result.asocial_groups || [];
      
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        groups: groups
      };
      
      sendResponse({ success: true, data: exportData });
    } catch (error) {
      console.error('Failed to export keys:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Import keys
   */
  async importKeys(data, sendResponse) {
    try {
      const { groups } = data;
      
      if (!groups || !Array.isArray(groups)) {
        sendResponse({ success: false, error: 'Invalid import data' });
        return;
      }
      
      // Merge with existing groups
      const result = await chrome.storage.local.get(['asocial_groups']);
      const existingGroups = result.asocial_groups || [];
      const mergedGroups = [...existingGroups, ...groups];
      
      await chrome.storage.local.set({ asocial_groups: mergedGroups });
      
      sendResponse({ success: true, data: { importedCount: groups.length } });
    } catch (error) {
      console.error('Failed to import keys:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle storage changes
   */
  handleStorageChange(changes, namespace) {
    if (namespace === 'local') {
      console.log('Storage changed:', changes);
      
      // Notify content scripts of changes
      this.notifyContentScripts('STORAGE_CHANGED', changes);
    }
  }

  /**
   * Handle tab updates
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if tab is on a supported platform
      const supportedPlatforms = [
        'linkedin.com',
        'facebook.com',
        'twitter.com',
        'x.com'
      ];
      
      const isSupported = supportedPlatforms.some(platform => 
        tab.url.includes(platform)
      );
      
      if (isSupported) {
        console.log('Supported platform detected:', tab.url);
        // Could inject content script or send message here
      }
    }
  }

  /**
   * Notify content scripts of changes
   */
  async notifyContentScripts(type, data) {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: type,
            data: data
          });
        } catch (error) {
          // Tab might not have content script or might be invalid
          // This is expected for some tabs
        }
      }
    } catch (error) {
      console.error('Failed to notify content scripts:', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('Cleaning up background service');
    // Clean up any resources, timers, etc.
  }
}

// Initialize background service
const asocialBackground = new AsocialBackground();

// Handle service worker lifecycle
chrome.runtime.onSuspend.addListener(() => {
  asocialBackground.cleanup();
});
