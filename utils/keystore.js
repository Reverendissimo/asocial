/**
 * Asocial KeyStore Management
 * Handles KeyStore creation, encryption, decryption, and file operations
 */

class AsocialKeyStore {
  constructor() {
    this.crypto = new AsocialCrypto();
    this.storagePrefix = 'asocial_keystore_';
  }

  /**
   * Create new KeyStore
   * @param {string} name - KeyStore name
   * @param {string} description - KeyStore description
   * @param {string} password - KeyStore password
   * @returns {Promise<Object>} Created KeyStore data
   */
  async createKeyStore(name, description, password) {
    try {
      console.log('AsocialKeyStore: Creating KeyStore:', name);
      
      // Validate inputs
      if (!name || !name.trim()) {
        throw new Error('KeyStore name is required');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Generate KeyStore ID
      const keyStoreId = this.generateKeyStoreId();
      
      // Create KeyStore data structure
      const keyStoreData = {
        id: keyStoreId,
        name: name.trim(),
        description: description ? description.trim() : '',
        createdAt: new Date().toISOString(),
        writerKeys: [],
        readerKeys: []
      };

      // Generate salt for password derivation
      const salt = this.crypto.generateSalt();
      
      // Derive key from password
      const derivedKey = await this.crypto.deriveKeyFromPassword(password, salt);
      
      // Encrypt KeyStore data
      const encryptedKeyStore = await this.crypto.encryptData(
        JSON.stringify(keyStoreData),
        derivedKey
      );

      // Store encrypted KeyStore
      const storageKey = this.storagePrefix + keyStoreId;
      const storageData = {
        salt: this.crypto.arrayBufferToBase64(salt),
        encryptedData: this.crypto.arrayBufferToBase64(encryptedKeyStore.data),
        iv: this.crypto.arrayBufferToBase64(encryptedKeyStore.iv)
      };

      // Store both encrypted data and metadata
      await chrome.storage.local.set({ 
        [storageKey]: storageData,
        [storageKey + '_meta']: {
          name: name,
          description: description,
          createdAt: keyStoreData.createdAt
        }
      });

      console.log('AsocialKeyStore: KeyStore created successfully');
      return {
        success: true,
        keyStore: keyStoreData,
        keyStoreId: keyStoreId,
        derivedKey: derivedKey
      };
    } catch (error) {
      console.error('AsocialKeyStore: Error creating KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load KeyStore from storage using existing derived key
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Already derived key
   * @returns {Promise<Object>} Load result
   */
  async loadKeyStoreWithDerivedKey(keyStoreId, derivedKey) {
    try {
      console.log('AsocialKeyStore: Loading KeyStore with derived key:', keyStoreId);
      
      const storageKey = this.storagePrefix + keyStoreId;
      const result = await chrome.storage.local.get([storageKey]);
      
      if (!result[storageKey]) {
        throw new Error('KeyStore not found');
      }

      const storageData = result[storageKey];
      
      // Decode salt and encrypted data
      const salt = this.crypto.base64ToArrayBuffer(storageData.salt);
      const encryptedData = this.crypto.base64ToArrayBuffer(storageData.encryptedData);
      const iv = this.crypto.base64ToArrayBuffer(storageData.iv);
      
      // Decrypt KeyStore data using existing derived key
      const decryptedData = await this.crypto.decryptData(
        {
          data: new Uint8Array(encryptedData),
          iv: new Uint8Array(iv)
        },
        derivedKey
      );

      const keyStoreData = JSON.parse(decryptedData);
      
      console.log('AsocialKeyStore: KeyStore loaded successfully with derived key');
      return {
        success: true,
        keyStore: keyStoreData,
        derivedKey: derivedKey
      };
    } catch (error) {
      console.error('AsocialKeyStore: Error loading KeyStore with derived key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load and decrypt KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} password - KeyStore password
   * @returns {Promise<Object>} Decrypted KeyStore data
   */
  async loadKeyStore(keyStoreId, password) {
    try {
      console.log('AsocialKeyStore: Loading KeyStore:', keyStoreId);
      
      const storageKey = this.storagePrefix + keyStoreId;
      const result = await chrome.storage.local.get([storageKey]);
      
      if (!result[storageKey]) {
        throw new Error('KeyStore not found');
      }

      const storageData = result[storageKey];
      
      // Decode salt and encrypted data
      const salt = this.crypto.base64ToArrayBuffer(storageData.salt);
      const encryptedData = this.crypto.base64ToArrayBuffer(storageData.encryptedData);
      const iv = this.crypto.base64ToArrayBuffer(storageData.iv);
      
      // Derive key from password
      const derivedKey = await this.crypto.deriveKeyFromPassword(password, new Uint8Array(salt));
      
      // Decrypt KeyStore data
      const decryptedData = await this.crypto.decryptData(
        {
          data: new Uint8Array(encryptedData),
          iv: new Uint8Array(iv)
        },
        derivedKey
      );

      const keyStoreData = JSON.parse(decryptedData);
      
      console.log('AsocialKeyStore: KeyStore loaded successfully');
      return {
        success: true,
        keyStore: keyStoreData,
        derivedKey: derivedKey
      };
    } catch (error) {
      console.error('AsocialKeyStore: Error loading KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save KeyStore with updated data
   * @param {string} keyStoreId - KeyStore ID
   * @param {Object} keyStoreData - Updated KeyStore data
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Save result
   */
  async saveKeyStore(keyStoreId, keyStoreData, derivedKey) {
    try {
      console.log('AsocialKeyStore: Saving KeyStore:', keyStoreId);
      
      // Get the original salt from storage
      const storageKey = this.storagePrefix + keyStoreId;
      const existingData = await chrome.storage.local.get([storageKey]);
      if (!existingData[storageKey]) {
        throw new Error('KeyStore not found in storage');
      }
      
      const originalSalt = existingData[storageKey].salt;
      
      // Encrypt updated KeyStore data
      const encryptedKeyStore = await this.crypto.encryptData(
        JSON.stringify(keyStoreData),
        derivedKey
      );

      // Store encrypted KeyStore with original salt
      const storageData = {
        salt: originalSalt, // Keep the original salt
        encryptedData: this.crypto.arrayBufferToBase64(encryptedKeyStore.data),
        iv: this.crypto.arrayBufferToBase64(encryptedKeyStore.iv)
      };

      await chrome.storage.local.set({ [storageKey]: storageData });

      console.log('AsocialKeyStore: KeyStore saved successfully');
      return {
        success: true
      };
    } catch (error) {
      console.error('AsocialKeyStore: Error saving KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add key to KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {Object} keyData - Key data to add
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @param {Object} keyStoreData - Optional already loaded KeyStore data
   * @returns {Promise<Object>} Add result
   */
  async addKeyToKeyStore(keyStoreId, keyData, derivedKey, keyStoreData = null) {
    try {
      console.log('AsocialKeyStore: Adding key to KeyStore:', keyStoreId);
      
      let currentKeyStore;
      if (keyStoreData) {
        // Use provided KeyStore data
        currentKeyStore = keyStoreData;
      } else {
        // Load current KeyStore using existing derived key
        const loadResult = await this.loadKeyStoreWithDerivedKey(keyStoreId, derivedKey);
        if (!loadResult.success) {
          throw new Error('Failed to load KeyStore');
        }
        currentKeyStore = loadResult.keyStore;
      }
      
      // Encrypt individual key
      const encryptedKey = await this.crypto.encryptData(
        JSON.stringify(keyData),
        derivedKey
      );

      // Add encrypted key to appropriate list
      const encryptedKeyData = {
        id: keyData.id,
        name: keyData.name,
        type: keyData.type,
        createdAt: keyData.createdAt,
        encryptedData: this.crypto.arrayBufferToBase64(encryptedKey.data),
        iv: this.crypto.arrayBufferToBase64(encryptedKey.iv),
        tag: this.crypto.arrayBufferToBase64(encryptedKey.tag)
      };

      if (keyData.type === 'writer') {
        currentKeyStore.writerKeys.push(encryptedKeyData);
      } else {
        currentKeyStore.readerKeys.push(encryptedKeyData);
      }

      // Save updated KeyStore
      const saveResult = await this.saveKeyStore(keyStoreId, currentKeyStore, derivedKey);
      
      if (saveResult.success) {
        console.log('AsocialKeyStore: Key added successfully');
        return {
          success: true,
          key: keyData
        };
      } else {
        throw new Error('Failed to save KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyStore: Error adding key to KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove key from KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} keyId - Key ID to remove
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Remove result
   */
  async removeKeyFromKeyStore(keyStoreId, keyId, derivedKey) {
    try {
      console.log('AsocialKeyStore: Removing key from KeyStore:', keyStoreId, keyId);
      
      // Load current KeyStore using existing derived key
      const loadResult = await this.loadKeyStoreWithDerivedKey(keyStoreId, derivedKey);
      if (!loadResult.success) {
        throw new Error('Failed to load KeyStore');
      }

      const keyStoreData = loadResult.keyStore;
      
      // Remove key from appropriate list
      keyStoreData.writerKeys = keyStoreData.writerKeys.filter(key => key.id !== keyId);
      keyStoreData.readerKeys = keyStoreData.readerKeys.filter(key => key.id !== keyId);

      // Save updated KeyStore
      const saveResult = await this.saveKeyStore(keyStoreId, keyStoreData, derivedKey);
      
      if (saveResult.success) {
        console.log('AsocialKeyStore: Key removed successfully');
        return {
          success: true
        };
      } else {
        throw new Error('Failed to save KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyStore: Error removing key from KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get decrypted keys from KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @param {string} keyType - Key type ('writer' or 'reader')
   * @param {Object} keyStoreData - Optional pre-loaded KeyStore data
   * @returns {Promise<Array>} Decrypted keys
   */
  async getDecryptedKeys(keyStoreId, derivedKey, keyType, keyStoreData = null) {
    try {
      console.log('AsocialKeyStore: Getting decrypted keys:', keyType);
      
      // Use provided KeyStore data or load from storage
      if (!keyStoreData) {
        const loadResult = await this.loadKeyStore(keyStoreId, ''); // We already have the derived key
        if (!loadResult.success) {
          throw new Error('Failed to load KeyStore');
        }
        keyStoreData = loadResult.keyStore;
      }

      const encryptedKeys = keyType === 'writer' ? keyStoreData.writerKeys : keyStoreData.readerKeys;
      
      // Decrypt each key
      const decryptedKeys = [];
      for (const encryptedKey of encryptedKeys) {
        try {
          const decryptedData = await this.crypto.decryptData(
            {
              data: this.crypto.base64ToArrayBuffer(encryptedKey.encryptedData),
              iv: this.crypto.base64ToArrayBuffer(encryptedKey.iv),
              tag: this.crypto.base64ToArrayBuffer(encryptedKey.tag)
            },
            derivedKey
          );

          const keyData = JSON.parse(decryptedData);
          console.log('AsocialKeyStore: Decrypted key data:', keyData);
          console.log('AsocialKeyStore: Key has publicKey field:', 'publicKey' in keyData);
          console.log('AsocialKeyStore: Public key value:', keyData.publicKey);
          decryptedKeys.push(keyData);
        } catch (error) {
          console.error('AsocialKeyStore: Error decrypting key:', encryptedKey.id, error);
          // Continue with other keys
        }
      }

      console.log('AsocialKeyStore: Decrypted keys retrieved:', decryptedKeys.length);
      return decryptedKeys;
    } catch (error) {
      console.error('AsocialKeyStore: Error getting decrypted keys:', error);
      return [];
    }
  }

  /**
   * List all KeyStores
   * @returns {Promise<Array>} List of KeyStore metadata
   */
  async listKeyStores() {
    try {
      console.log('AsocialKeyStore: Listing all KeyStores');
      
      const result = await chrome.storage.local.get(null);
      const keyStores = [];
      
      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith(this.storagePrefix)) {
          const keyStoreId = key.replace(this.storagePrefix, '');
          keyStores.push({
            id: keyStoreId,
            name: 'Unknown', // We can't decrypt without password
            createdAt: 'Unknown'
          });
        }
      }
      
      console.log('AsocialKeyStore: Found KeyStores:', keyStores.length);
      return keyStores;
    } catch (error) {
      console.error('AsocialKeyStore: Error listing KeyStores:', error);
      return [];
    }
  }

  /**
   * Export KeyStore to file
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} password - KeyStore password
   * @returns {Promise<Object>} Export result
   */
  async exportKeyStore(keyStoreId, password) {
    try {
      console.log('AsocialKeyStore: Exporting KeyStore:', keyStoreId);
      
      // Load KeyStore
      const loadResult = await this.loadKeyStore(keyStoreId, password);
      if (!loadResult.success) {
        throw new Error('Failed to load KeyStore');
      }

      const keyStoreData = loadResult.keyStore;
      
      // Create export data
      const exportData = {
        version: '1.0',
        keyStore: keyStoreData,
        exportedAt: new Date().toISOString()
      };

      // Convert to JSON and create blob
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link (only works in browser context, not service worker)
      if (typeof document !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asocial_keystore_${keyStoreData.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // In service worker context, we can't download files directly
        // The popup will handle the actual download
        console.log('AsocialKeyStore: Export data ready for download');
      }

      console.log('AsocialKeyStore: KeyStore exported successfully');
      return {
        success: true
      };
    } catch (error) {
      console.error('AsocialKeyStore: Error exporting KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import KeyStore from file
   * @param {File} file - KeyStore file
   * @param {string} password - KeyStore password
   * @returns {Promise<Object>} Import result
   */
  async importKeyStore(file, password) {
    try {
      console.log('AsocialKeyStore: Importing KeyStore from file');
      
      // Read file content
      const fileContent = await this.readFileAsText(file);
      const importData = JSON.parse(fileContent);
      
      if (!importData.keyStore) {
        throw new Error('Invalid KeyStore file format');
      }

      const keyStoreData = importData.keyStore;
      
      // Generate new KeyStore ID
      const keyStoreId = this.generateKeyStoreId();
      keyStoreData.id = keyStoreId;
      
      // Create KeyStore with new password
      const createResult = await this.createKeyStore(
        keyStoreData.name,
        keyStoreData.description,
        password
      );
      
      if (createResult.success) {
        console.log('AsocialKeyStore: KeyStore imported successfully');
        return {
          success: true,
          keyStore: keyStoreData
        };
      } else {
        throw new Error('Failed to create imported KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyStore: Error importing KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique KeyStore ID
   * @returns {string} Unique KeyStore ID
   */
  generateKeyStoreId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `keystore_${timestamp}_${random}`;
  }

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialKeyStore;
} else if (typeof window !== 'undefined') {
  window.AsocialKeyStore = AsocialKeyStore;
} else if (typeof self !== 'undefined') {
  self.AsocialKeyStore = AsocialKeyStore;
}
