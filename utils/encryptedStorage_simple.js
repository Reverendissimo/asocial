/**
 * Asocial Simplified Storage Manager
 * Handles simple JSON storage with multi-user support (no encryption bullshit)
 */

class AsocialEncryptedStorage {
  constructor() {
    this.currentUser = null;
    this.currentStorage = null;
    this.currentPassword = null; // Store password temporarily for saving
    this.storageKey = 'asocial_current_user';
    this.storageFilesKey = 'asocial_storage_files';
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const isLoggedIn = result[this.storageKey] !== null && result[this.storageKey] !== undefined;
      return isLoggedIn;
    } catch (error) {
      console.error('Failed to check login status:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return result[this.storageKey];
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Set current user
   */
  async setCurrentUser(username) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: username });
    } catch (error) {
      console.error('Failed to set current user:', error);
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
      this.currentUser = storageName;
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
      const storageFile = files.find(f => f.username === storageName);
      
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
      this.currentUser = storageName;
      this.currentPassword = password; // Store password for saving
      
      // Update current user
      await this.setCurrentUser(storageName);
      
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
      if (!this.currentStorage || !this.currentUser) {
        throw new Error('No storage open');
      }
      
      // Find the correct filename from storage files list
      const files = await this.getStorageFiles();
      const storageFile = files.find(f => f.username === this.currentUser);
      
      if (!storageFile) {
        throw new Error(`Storage file not found for user: ${this.currentUser}`);
      }
      
      const filename = storageFile.filename;
      console.log('Saving storage to file:', filename);
      
      // Save storage data directly as JSON (no encryption bullshit)
      await chrome.storage.local.set({ [filename]: JSON.stringify(this.currentStorage) });
      console.log('Storage data saved directly as JSON');
      
      console.log(`Saved storage for user: ${this.currentUser} to file: ${filename}`);
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
  async addStorageFileToList(filename, username) {
    try {
      const files = await this.getStorageFiles();
      files.push({ filename, username, createdAt: new Date().toISOString() });
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
   * Logout current user
   */
  async logout() {
    try {
      this.currentUser = null;
      this.currentStorage = null;
      this.currentPassword = null;
      await chrome.storage.local.remove([this.storageKey]);
      console.log('User logged out');
    } catch (error) {
      console.error('Failed to logout:', error);
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
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if storage is open
   */
  isStorageOpen() {
    return this.currentStorage !== null && this.currentUser !== null;
  }
}
