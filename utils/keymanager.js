/**
 * Asocial Key Manager
 * Handles key generation, storage, retrieval, and management
 */

class AsocialKeyManager {
  constructor() {
    this.crypto = new AsocialCrypto();
    this.keyStore = new AsocialKeyStore();
  }

  /**
   * Create new writer key (public key)
   * @param {string} name - Key name
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Created writer key
   */
  async createWriterKey(name, keyStoreId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Creating writer key:', name);
      
      // Validate inputs
      if (!name || !name.trim()) {
        throw new Error('Key name is required');
      }

      // Generate ECDSA-256 key pair
      const keyPair = await this.crypto.generateKeyPair(name.trim());
      
      // Generate magic code for the key pair (same for both writer and reader)
      console.log('AsocialKeyManager: Generating magic code for key pair');
      const magicCode = await this.crypto.generateMagicCode(keyPair.privateKey);
      console.log('AsocialKeyManager: Generated magic code:', magicCode);

      // Create writer key data (public key for writing)
      const writerKeyData = {
        id: keyPair.id,
        name: name.trim(),
        type: 'writer',
        publicKey: keyPair.publicKey,
        createdAt: keyPair.createdAt,
        magicCode: magicCode // Store the same magic code as the reader key
      };

        // Create reader key data (private key for reading)
        // The private key is already exported as Base64 from generateKeyPair
        console.log('AsocialKeyManager: Using same magic code for reader key');
        
        const readerKeyData = {
          id: keyPair.id + '_reader', // Different ID for reader key
          name: name.trim() + ' (Reader)',
          type: 'reader',
          privateKey: keyPair.privateKey, // Already Base64 string from generateKeyPair
          createdAt: keyPair.createdAt,
          magicCode: magicCode
        };
        
        console.log('AsocialKeyManager: Reader key data with magic code:', readerKeyData);

      // Add both keys to KeyStore
      const addWriterResult = await this.keyStore.addKeyToKeyStore(keyStoreId, writerKeyData, derivedKey);
      const addReaderResult = await this.keyStore.addKeyToKeyStore(keyStoreId, readerKeyData, derivedKey);
      
      if (addWriterResult.success && addReaderResult.success) {
        console.log('AsocialKeyManager: Writer and reader keys created successfully');
        return {
          success: true,
          writerKey: writerKeyData,
          readerKey: readerKeyData
        };
      } else {
        throw new Error('Failed to add keys to KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyManager: Error creating writer key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create new reader key (private key)
   * @param {string} name - Key name
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Created reader key
   */
  async createReaderKey(name, keyStoreId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Creating reader key:', name);
      
      // Validate inputs
      if (!name || !name.trim()) {
        throw new Error('Key name is required');
      }

      // Generate ECDSA-256 key pair
      const keyPair = await this.crypto.generateKeyPair(name.trim());
      
      // Generate magic code from private key
      const magicCode = await this.crypto.generateMagicCode(keyPair.privateKey);
      
      // Create reader key data (private key only)
      const readerKeyData = {
        id: keyPair.id,
        name: name.trim(),
        type: 'reader',
        privateKey: keyPair.privateKey,
        magicCode: magicCode,
        createdAt: keyPair.createdAt
      };

      // Add to KeyStore
      const addResult = await this.keyStore.addKeyToKeyStore(keyStoreId, readerKeyData, derivedKey);
      
      if (addResult.success) {
        console.log('AsocialKeyManager: Reader key created successfully');
        return {
          success: true,
          key: readerKeyData
        };
      } else {
        throw new Error('Failed to add reader key to KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyManager: Error creating reader key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add reader key from clipboard
   * @param {string} name - Key name
   * @param {string} privateKey - Private key from clipboard
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Added reader key
   */
  async addReaderKeyFromClipboard(name, privateKey, keyStoreId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Adding reader key from clipboard:', name);
      
      // Validate inputs
      if (!name || !name.trim()) {
        throw new Error('Key name is required');
      }
      
      if (!privateKey || !privateKey.trim()) {
        throw new Error('Private key is required');
      }

      let readerKeyName, privateKeyData, magicCode;

      // Check if the input is JSON (exported reader key)
      try {
        console.log('AsocialKeyManager: Attempting to parse JSON:', privateKey.trim().substring(0, 100) + '...');
        const jsonData = JSON.parse(privateKey.trim());
        console.log('AsocialKeyManager: Parsed JSON data:', jsonData);
        
        if (jsonData.name && jsonData.privateKey) {
          // It's a JSON export, use the data from it
          readerKeyName = jsonData.name;
          privateKeyData = jsonData.privateKey;
          magicCode = jsonData.magicCode || null; // Use magicCode if available, otherwise null
          console.log('AsocialKeyManager: Importing from JSON export');
        } else {
          throw new Error('Invalid JSON format - missing required fields');
        }
      } catch (jsonError) {
        // Not JSON, treat as raw private key
        console.log('AsocialKeyManager: JSON parse failed:', jsonError.message);
        console.log('AsocialKeyManager: Importing as raw private key');
        
        // Validate private key format (try to import it)
        try {
          await this.crypto.importKey(privateKey.trim(), 'pkcs8', 'private');
        } catch (error) {
          throw new Error('Invalid private key format');
        }

        // Generate magic code from private key
        magicCode = await this.crypto.generateMagicCode(privateKey.trim());
        readerKeyName = name.trim();
        privateKeyData = privateKey.trim();
      }
      
      // Create reader key data
      const readerKeyData = {
        id: this.crypto.generateKeyId(),
        name: readerKeyName,
        type: 'reader',
        privateKey: privateKeyData,
        magicCode: magicCode,
        createdAt: new Date().toISOString()
      };

      // Add to KeyStore
      const addResult = await this.keyStore.addKeyToKeyStore(keyStoreId, readerKeyData, derivedKey);
      
      if (addResult.success) {
        console.log('AsocialKeyManager: Reader key added from clipboard successfully');
        return {
          success: true,
          key: readerKeyData
        };
      } else {
        throw new Error('Failed to add reader key to KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyManager: Error adding reader key from clipboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get writer keys from KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @param {Object} keyStoreData - Optional pre-loaded KeyStore data
   * @returns {Promise<Array>} Writer keys
   */
  async getWriterKeys(keyStoreId, derivedKey, keyStoreData = null) {
    try {
      console.log('AsocialKeyManager: Getting writer keys');
      
      const keys = await this.keyStore.getDecryptedKeys(keyStoreId, derivedKey, 'writer', keyStoreData);
      
      // Return only metadata (no actual keys) - UI only needs ID
      const keyMetadata = keys.map(key => ({
        id: key.id,
        name: key.name,
        type: key.type,
        createdAt: key.createdAt,
        magicCode: key.magicCode || null
      }));

      console.log('AsocialKeyManager: Retrieved writer keys:', keyMetadata.length);
      return keyMetadata;
    } catch (error) {
      console.error('AsocialKeyManager: Error getting writer keys:', error);
      return [];
    }
  }

  /**
   * Get reader keys from KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @param {Object} keyStoreData - Optional pre-loaded KeyStore data
   * @returns {Promise<Array>} Reader keys
   */
  async getReaderKeys(keyStoreId, derivedKey, keyStoreData = null) {
    try {
      console.log('AsocialKeyManager: Getting reader keys');
      
      const keys = await this.keyStore.getDecryptedKeys(keyStoreId, derivedKey, 'reader', keyStoreData);
      
      // Include ALL reader keys (both manual and auto-generated)
      // Auto-generated reader keys correspond to writer keys and should be available
      const allReaderKeys = keys;
      
      // Return key data - include private key for background worker decryption
      const keyMetadata = allReaderKeys.map(key => ({
        id: key.id,
        name: key.name,
        type: key.type,
        createdAt: key.createdAt,
        magicCode: key.magicCode,
        privateKey: key.privateKey  // Include private key for decryption
      }));

      console.log('AsocialKeyManager: Retrieved reader keys:', keyMetadata.length);
      return keyMetadata;
    } catch (error) {
      console.error('AsocialKeyManager: Error getting reader keys:', error);
      return [];
    }
  }


  /**
   * Get writer key for encryption
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} keyId - Key ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @returns {Promise<Object>} Writer key with public key
   */
  async getWriterKeyForEncryption(keyStoreId, keyId, derivedKey, keyStoreData = null) {
    try {
      console.log('AsocialKeyManager: Getting writer key for encryption:', keyId);
      
      const keys = await this.keyStore.getDecryptedKeys(keyStoreId, derivedKey, 'writer', keyStoreData);
      const writerKey = keys.find(key => key.id === keyId);
      
      if (!writerKey) {
        throw new Error('Writer key not found');
      }

      console.log('AsocialKeyManager: Writer key retrieved for encryption');
      return {
        success: true,
        key: writerKey
      };
    } catch (error) {
      console.error('AsocialKeyManager: Error getting writer key for encryption:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get reader key for decryption
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} magicCode - Magic code to identify key
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @returns {Promise<Object>} Reader key with private key
   */
  async getReaderKeyForDecryption(keyStoreId, magicCode, derivedKey) {
    try {
      console.log('AsocialKeyManager: Getting reader key for decryption:', magicCode);
      
      const keys = await this.keyStore.getDecryptedKeys(keyStoreId, derivedKey, 'reader');
      const readerKey = keys.find(key => key.magicCode === magicCode);
      
      if (!readerKey) {
        throw new Error('Reader key not found for magic code');
      }

      console.log('AsocialKeyManager: Reader key retrieved for decryption');
      return {
        success: true,
        key: readerKey
      };
    } catch (error) {
      console.error('AsocialKeyManager: Error getting reader key for decryption:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete key from KeyStore
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} keyId - Key ID to delete
   * @param {CryptoKey} derivedKey - Derived key for encryption
   * @returns {Promise<Object>} Delete result
   */
  async deleteKey(keyStoreId, keyId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Deleting key:', keyId);
      
      const result = await this.keyStore.removeKeyFromKeyStore(keyStoreId, keyId, derivedKey);
      
      if (result.success) {
        console.log('AsocialKeyManager: Key deleted successfully');
        return {
          success: true
        };
      } else {
        throw new Error('Failed to delete key from KeyStore');
      }
    } catch (error) {
      console.error('AsocialKeyManager: Error deleting key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export writer key to clipboard
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} keyId - Key ID to export
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @returns {Promise<Object>} Export result
   */
  async exportWriterKey(keyStoreId, keyId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Exporting writer key:', keyId);
      
      const result = await this.getWriterKeyForEncryption(keyStoreId, keyId, derivedKey);
      
      if (result.success) {
        // Copy public key to clipboard
        await navigator.clipboard.writeText(result.key.publicKey);
        
        console.log('AsocialKeyManager: Writer key exported to clipboard');
        return {
          success: true,
          message: 'Writer key copied to clipboard'
        };
      } else {
        throw new Error('Failed to get writer key for export');
      }
    } catch (error) {
      console.error('AsocialKeyManager: Error exporting writer key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get key metadata for display
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} keyId - Key ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @returns {Promise<Object>} Key metadata
   */
  async getKeyMetadata(keyStoreId, keyId, derivedKey) {
    try {
      console.log('AsocialKeyManager: Getting key metadata:', keyId);
      
      // Get all keys to find the specific one
      const writerKeys = await this.getWriterKeys(keyStoreId, derivedKey);
      const readerKeys = await this.getReaderKeys(keyStoreId, derivedKey);
      
      const allKeys = [...writerKeys, ...readerKeys];
      const key = allKeys.find(k => k.id === keyId);
      
      if (!key) {
        throw new Error('Key not found');
      }

      console.log('AsocialKeyManager: Key metadata retrieved');
      return {
        success: true,
        metadata: key
      };
    } catch (error) {
      console.error('AsocialKeyManager: Error getting key metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate key name
   * @param {string} name - Key name to validate
   * @returns {boolean} True if valid
   */
  validateKeyName(name) {
    if (!name || !name.trim()) {
      return false;
    }
    
    if (name.trim().length < 2) {
      return false;
    }
    
    if (name.trim().length > 50) {
      return false;
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name.trim())) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate key name suggestions
   * @param {string} type - Key type ('writer' or 'reader')
   * @returns {Array} Suggested names
   */
  generateKeyNameSuggestions(type) {
    const suggestions = [];
    
    if (type === 'writer') {
      suggestions.push('Family', 'Friends', 'Work', 'Public', 'General');
    } else {
      suggestions.push('Personal', 'Private', 'Main', 'Primary', 'Backup');
    }
    
    return suggestions;
  }

  /**
   * Get the private key for a writer key (from corresponding reader key)
   * @param {string} keyStoreId - KeyStore ID
   * @param {string} writerKeyId - Writer key ID
   * @param {CryptoKey} derivedKey - Derived key for decryption
   * @param {Object} keyStoreData - Optional pre-loaded KeyStore data
   * @returns {Promise<Object>} Private key result
   */
  async getWriterKeyPrivateKey(keyStoreId, writerKeyId, derivedKey, keyStoreData = null) {
    try {
      console.log('AsocialKeyManager: Getting private key for writer key:', writerKeyId);
      
      // Get the corresponding reader key (private key)
      const readerKeyId = writerKeyId + '_reader';
      const readerKeys = await this.keyStore.getDecryptedKeys(keyStoreId, derivedKey, 'reader', keyStoreData);
      
      const readerKey = readerKeys.find(key => key.id === readerKeyId);
      if (!readerKey) {
        return { success: false, error: 'Reader key not found for this writer key' };
      }

      console.log('AsocialKeyManager: Found reader key for export:', readerKey);
      console.log('AsocialKeyManager: Reader key magic code:', readerKey.magicCode);

      // Get KeyStore name for the export - we need to get this from the background worker
      const keyStoreName = 'KeyStore'; // Will be replaced by background worker
      
      // Create export object with all necessary information
      const exportData = {
        name: `${keyStoreName} - ${readerKey.name.replace(' (Reader)', '')}`,
        privateKey: readerKey.privateKey,
        magicCode: readerKey.magicCode,
        type: 'reader',
        exportedAt: new Date().toISOString()
      };
      
      console.log('AsocialKeyManager: Export data:', exportData);

      console.log('AsocialKeyManager: Private key export data created successfully');
      return {
        success: true,
        exportData: exportData
      };
    } catch (error) {
      console.error('AsocialKeyManager: Error getting private key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialKeyManager;
} else if (typeof window !== 'undefined') {
  window.AsocialKeyManager = AsocialKeyManager;
} else if (typeof self !== 'undefined') {
  self.AsocialKeyManager = AsocialKeyManager;
}
