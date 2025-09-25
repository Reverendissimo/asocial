/**
 * Asocial Encrypted Storage Manager
 * Handles encrypted .ASoc file storage with multi-user support
 */

class AsocialEncryptedStorage {
  constructor() {
    this.currentStorageName = null;
    this.currentStorage = null;
    this.currentPassword = null;
    this.storageKey = 'asocial_current_storage';
    this.storageFilesKey = 'asocial_storage_files';
    this.debug = window.AsocialDebug || { log: () => {}, error: console.error };
  }

  /**
   * Check if storage is open
   */
  async isLoggedIn() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const isLoggedIn = result[this.storageKey] !== null && result[this.storageKey] !== undefined;
      return isLoggedIn;
    } catch (error) {
      this.debug.error('Failed to check storage status:', error);
      return false;
    }
  }

  /**
   * Get current storage name
   */
  async getCurrentStorageName() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return result[this.storageKey];
    } catch (error) {
      this.debug.error('Failed to get current storage name:', error);
      return null;
    }
  }

  /**
   * Set current storage name
   */
  async setCurrentStorageName(storageName) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: storageName });
    } catch (error) {
      console.error('Failed to set current storage name:', error);
      throw error;
    }
  }

  /**
   * Validate credentials
   */
  validateCredentials(storageName, password) {
    if (!storageName || storageName.trim().length === 0) {
      throw new Error('Storage name is required');
    }
    if (!password || password.trim().length === 0) {
      throw new Error('Password is required');
    }
    if (storageName.length < 3) {
      throw new Error('Storage name must be at least 3 characters');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  /**
   * Create new storage file (simplified - no encryption)
   */
  async createStorage(storageName, password) {
    try {
      // Validate storage name and password
      this.validateCredentials(storageName, password);
      
      // Generate unique storage filename with timestamp
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substr(2, 9);
      const filename = `asocial_storage_${storageName}_${timestamp}_${uniqueId}.ASoc`;
      console.log('Generated unique filename:', filename);
      
      // Create storage data structure
      const storageData = {
        version: '1.0',
        storageName: storageName,
        createdAt: new Date().toISOString(),
        writerKeys: [],
        readerKeys: []
      };
      
      // Store data directly as JSON (no encryption bullshit)
      await chrome.storage.local.set({ [filename]: JSON.stringify(storageData) });
      
      // Add to storage files list
      await this.addStorageFileToList(filename, storageName);
      
      // Set current storage for immediate use
      this.currentStorage = storageData;
      this.currentStorageName = storageName;
      this.currentPassword = password; // Store password for saving
      
      console.log(`Created storage: ${storageName}`);
      return filename;
    } catch (error) {
      console.error('Failed to create storage:', error);
      throw error;
    }
  }

  /**
   * Open storage file (simplified - no encryption)
   */
  async openStorage(storageName, password) {
    try {
      // Find the correct filename from storage files list
      const files = await this.getStorageFiles();
      const storageFile = files.find(f => f.storageName === storageName);
      
      if (!storageFile) {
        throw new Error(`Storage file not found for user: ${storageName}`);
      }
      
      const filename = storageFile.filename;
      console.log('Opening storage file:', filename);
      
      // Get storage data directly (no encryption bullshit)
      const result = await chrome.storage.local.get([filename]);
      const storageData = JSON.parse(result[filename]);
      
      if (!storageData) {
        throw new Error('Storage file not found');
      }
      
      // Validate storage data
      if (!storageData || storageData.storageName !== storageName) {
        throw new Error('Invalid storage data');
      }
      
      // Set current storage
      this.currentStorage = storageData;
      this.currentStorageName = storageName;
      this.currentPassword = password; // Store password for saving
      
      // Update current storage name
      await this.setCurrentStorageName(storageName);
      
      console.log(`Opened storage: ${storageName}`);
      return storageData;
    } catch (error) {
      console.error('Failed to open storage:', error);
      throw error;
    }
  }

  /**
   * Save current storage
   */
  async saveStorage() {
    try {
      if (!this.currentStorage || !this.currentStorageName) {
        throw new Error('No storage open');
      }
      
      // Find the correct filename from storage files list
      const files = await this.getStorageFiles();
      const storageFile = files.find(f => f.storageName === this.currentStorageName);
      
      if (!storageFile) {
        throw new Error(`Storage file not found for storage: ${this.currentStorageName}`);
      }
      
      const filename = storageFile.filename;
      console.log('Saving storage to file:', filename);
      
      // Save storage data directly as JSON (no encryption bullshit)
      await chrome.storage.local.set({ [filename]: JSON.stringify(this.currentStorage) });
      console.log('Storage data saved directly as JSON');
      
      console.log(`Saved storage for storage: ${this.currentStorageName} to file: ${filename}`);
    } catch (error) {
      console.error('Failed to save storage:', error);
      throw error;
    }
  }

  /**
   * Get all storage files
   */
  async getStorageFiles() {
    try {
      const result = await chrome.storage.local.get([this.storageFilesKey]);
      return result[this.storageFilesKey] || [];
    } catch (error) {
      console.error('Failed to get storage files:', error);
      return [];
    }
  }

  /**
   * Add storage file to list
   */
  async addStorageFileToList(filename, storageName) {
    try {
      const files = await this.getStorageFiles();
      files.push({ filename, storageName, createdAt: new Date().toISOString() });
      await chrome.storage.local.set({ [this.storageFilesKey]: files });
    } catch (error) {
      console.error('Failed to add storage file to list:', error);
      throw error;
    }
  }

  /**
   * Remove storage file from list
   */
  async removeStorageFileFromList(filename) {
    try {
      const files = await this.getStorageFiles();
      const filteredFiles = files.filter(f => f.filename !== filename);
      await chrome.storage.local.set({ [this.storageFilesKey]: filteredFiles });
    } catch (error) {
      console.error('Failed to remove storage file from list:', error);
      throw error;
    }
  }

  /**
   * Test if storage file is valid
   */
  async testStorageFile(filename) {
    try {
      const result = await chrome.storage.local.get([filename]);
      const data = result[filename];
      
      if (!data) {
        return { valid: false, error: 'File not found' };
      }
      
      // Check if data is string
      if (typeof data !== 'string') {
        return { valid: false, error: `Invalid data type: ${typeof data}` };
      }
      
      // Try to parse as JSON
      try {
        JSON.parse(data);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: 'Invalid JSON: ' + error.message };
      }
    } catch (error) {
      return { valid: false, error: 'Test failed: ' + error.message };
    }
  }

  /**
   * Clean up corrupted storage file
   */
  async cleanupCorruptedStorage(filename) {
    try {
      console.log('Cleaning up corrupted storage file:', filename);
      await chrome.storage.local.remove([filename]);
      console.log('Corrupted storage file removed');
      
      // Also remove from storage files list
      await this.removeStorageFileFromList(filename);
      console.log('Storage file removed from files list');
      
      return true;
    } catch (error) {
      console.error('Failed to cleanup corrupted storage:', error);
      return false;
    }
  }

  /**
   * Close current storage
   */
  async logout() {
    try {
      this.currentStorageName = null;
      this.currentStorage = null;
      this.currentPassword = null;
      await chrome.storage.local.remove([this.storageKey]);
      console.log('Storage closed');
    } catch (error) {
      console.error('Failed to close storage:', error);
      throw error;
    }
  }

  /**
   * Get current storage data
   */
  getCurrentStorage() {
    return this.currentStorage;
  }

  /**
   * Get current storage name
   */
  getCurrentStorageName() {
    return this.currentStorageName;
  }

  /**
   * Check if storage is open
   */
  isStorageOpen() {
    return this.currentStorage !== null && this.currentStorageName !== null;
  }
}
