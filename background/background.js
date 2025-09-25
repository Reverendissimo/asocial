/**
 * Asocial Background Service Worker
 * Main worker for key storage, encryption, and message handling
 */

// Import crypto utilities
importScripts('../utils/crypto.js');
importScripts('../utils/keystore.js');
importScripts('../utils/keymanager.js');
importScripts('../utils/messagecrypto.js');

class AsocialBackgroundWorker {
  constructor() {
    this.activeKeyStore = null;
    this.keyStorePasswordHash = null;
    this.derivedKey = null;
    this.keyManager = null;
    this.keyStore = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      console.log('Asocial Background Worker: Initializing...');
      
      // Initialize crypto utilities
      this.crypto = new AsocialCrypto();
      this.keyStore = new AsocialKeyStore();
      this.keyManager = new AsocialKeyManager();
      this.messageCrypto = new AsocialMessageCrypto();
      
      // Set up message handling
      this.setupMessageHandling();
      
      // Load active KeyStore if exists
      await this.loadActiveKeyStore();
      
      this.initialized = true;
      console.log('Asocial Background Worker: Initialized successfully');
    } catch (error) {
      console.error('Asocial Background Worker: Initialization failed:', error);
    }
  }

  /**
   * Set up message handling from content scripts and popup
   */
  setupMessageHandling() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Asocial Background Worker: Received message:', message.action);
      
      switch (message.action) {
        case 'test':
          sendResponse({ success: true, message: 'Background worker is responding' });
          break;
          
        case 'getActiveKeyStore':
          sendResponse({ success: true, keyStore: this.activeKeyStore });
          break;
          
        case 'getKeyStoreList':
          const listResult = await this.getKeyStoreList();
          sendResponse(listResult);
          break;
          
        case 'createKeyStore':
          const createResult = await this.createKeyStore(message.name, message.description, message.password);
          sendResponse(createResult);
          break;
          
        case 'openKeyStore':
          const openResult = await this.openKeyStore(message.keystoreId, message.password);
          sendResponse(openResult);
          break;
          
        case 'closeKeyStore':
          this.closeKeyStore();
          sendResponse({ success: true });
          break;
          
        case 'deleteKeyStore':
          const deleteKeyStoreResult = await this.deleteKeyStore(message.keystoreId);
          sendResponse(deleteKeyStoreResult);
          break;
          
        case 'getWriterKeyPrivateKey':
          const getPrivateKeyResult = await this.getWriterKeyPrivateKey(message.writerKeyId);
          sendResponse(getPrivateKeyResult);
          break;
          
        case 'getWriterKeys':
          const writerKeys = await this.getWriterKeys();
          sendResponse({ success: true, keys: writerKeys });
          break;
          
        case 'getReaderKeys':
          const readerKeys = await this.getReaderKeys();
          sendResponse({ success: true, keys: readerKeys });
          break;
          
        case 'createWriterKey':
          const writerResult = await this.createWriterKey(message.name);
          sendResponse(writerResult);
          break;
          
        case 'addReaderKey':
          const readerResult = await this.addReaderKey(message.name, message.privateKey);
          sendResponse(readerResult);
          break;
          
        case 'deleteKey':
          const deleteResult = await this.deleteKey(message.keyId);
          sendResponse(deleteResult);
          break;
          
        case 'encryptMessage':
          const encryptResult = await this.encryptMessage(message.text, message.writerKeyId);
          sendResponse(encryptResult);
          break;
          
        case 'decryptMessage':
          const decryptResult = await this.decryptMessage(message.encryptedText);
          sendResponse(decryptResult);
          break;
          
        case 'exportKeyStore':
          const exportResult = await this.exportKeyStore();
          sendResponse(exportResult);
          break;
          
        case 'importKeyStore':
          const importResult = await this.importKeyStore(message.keyStoreData, message.password);
          sendResponse(importResult);
          break;
          
        default:
          console.log('Asocial Background Worker: Unknown action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Load active KeyStore from storage
   */
  async loadActiveKeyStore() {
    try {
      const result = await chrome.storage.local.get(['asocial_active_keystore']);
      if (result.asocial_active_keystore) {
        this.activeKeyStore = result.asocial_active_keystore;
        console.log('Asocial Background Worker: Active KeyStore loaded:', this.activeKeyStore.name);
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error loading active KeyStore:', error);
    }
  }

  /**
   * Create new KeyStore
   */
  async createKeyStore(name, description, password) {
    try {
      console.log('Asocial Background Worker: Creating KeyStore:', name);
      
      const result = await this.keyStore.createKeyStore(name, description, password);
      
      if (result.success) {
        // Set as active KeyStore
        this.activeKeyStore = result.keyStore;
        this.derivedKey = result.derivedKey;
        this.keyStorePasswordHash = await this.crypto.hashData(password);
        
        // Store active KeyStore in memory
        await chrome.storage.local.set({ 
          asocial_active_keystore: this.activeKeyStore 
        });
        
        console.log('Asocial Background Worker: KeyStore created and set as active');
        return { success: true, keyStore: this.activeKeyStore };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error creating KeyStore:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Open existing KeyStore
   */
  async openKeyStore(keyStoreId, password) {
    try {
      console.log('Asocial Background Worker: Opening KeyStore:', keyStoreId);
      
      const result = await this.keyStore.loadKeyStore(keyStoreId, password);
      
      if (result.success) {
        // Set as active KeyStore
        this.activeKeyStore = result.keyStore;
        this.derivedKey = result.derivedKey;
        this.keyStorePasswordHash = await this.crypto.hashData(password);
        
        // Store active KeyStore in memory
        await chrome.storage.local.set({ 
          asocial_active_keystore: this.activeKeyStore 
        });
        
        console.log('Asocial Background Worker: KeyStore opened and set as active');
        return { success: true, keyStore: this.activeKeyStore };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error opening KeyStore:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close current KeyStore
   */
  closeKeyStore() {
    console.log('Asocial Background Worker: Closing KeyStore');
    this.activeKeyStore = null;
    this.keyStorePasswordHash = null;
    this.derivedKey = null;
    
    // Remove from storage
    chrome.storage.local.remove(['asocial_active_keystore']);
  }

  /**
   * Delete a KeyStore permanently
   */
  async deleteKeyStore(keyStoreId) {
    try {
      console.log('Asocial Background Worker: Deleting KeyStore:', keyStoreId);
      
      // If this is the active KeyStore, close it first
      if (this.activeKeyStore && this.activeKeyStore.id === keyStoreId) {
        this.closeKeyStore();
      }
      
      // Remove from storage
      const storageKey = 'asocial_keystore_' + keyStoreId;
      const metaKey = storageKey + '_meta';
      
      await chrome.storage.local.remove([storageKey, metaKey]);
      
      console.log('Asocial Background Worker: KeyStore deleted successfully');
      return {
        success: true
      };
    } catch (error) {
      console.error('Asocial Background Worker: Error deleting KeyStore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the private key for a writer key
   */
  async getWriterKeyPrivateKey(writerKeyId) {
    try {
      console.log('Asocial Background Worker: Getting private key for writer key:', writerKeyId);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }

      // Get the writer key from the KeyStore
      const writerKeys = await this.keyManager.getWriterKeys(
        this.activeKeyStore.id, 
        this.derivedKey,
        this.activeKeyStore
      );
      
      const writerKey = writerKeys.find(key => key.id === writerKeyId);
      if (!writerKey) {
        return { success: false, error: 'Writer key not found' };
      }

      // Get the private key from the KeyStore
      const privateKeyResult = await this.keyManager.getWriterKeyPrivateKey(
        this.activeKeyStore.id,
        writerKeyId,
        this.derivedKey,
        this.activeKeyStore
      );
      
      if (privateKeyResult.success) {
        // Update the export data with the actual KeyStore name
        const exportData = privateKeyResult.exportData;
        exportData.name = `${this.activeKeyStore.name} - ${exportData.name.split(' - ')[1]}`;
        
        console.log('Asocial Background Worker: Private key retrieved successfully');
        return {
          success: true,
          exportData: exportData
        };
      } else {
        return { success: false, error: privateKeyResult.error };
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error getting private key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of available KeyStores
   */
  async getKeyStoreList() {
    try {
      console.log('Asocial Background Worker: Getting KeyStore list');
      
      // Get all KeyStore files from storage
      const result = await chrome.storage.local.get();
      const keyStores = [];
      
      // Look for KeyStore metadata files (they have keys ending with '_meta')
      for (const [key, value] of Object.entries(result)) {
        console.log('Asocial Background Worker: Checking storage key:', key);
        console.log('Asocial Background Worker: Key value:', value);
        if (key.startsWith('asocial_keystore_') && key.endsWith('_meta') && value && value.name) {
          const keystoreId = key.replace('asocial_keystore_', '').replace('_meta', '');
          console.log('Asocial Background Worker: Extracted KeyStore ID:', keystoreId);
          keyStores.push({
            id: keystoreId,
            name: value.name,
            description: value.description,
            createdAt: value.createdAt
          });
        }
      }
      
      console.log('Asocial Background Worker: Found KeyStores:', keyStores.length);
      console.log('Asocial Background Worker: KeyStore details:', keyStores);
      return { success: true, keyStores: keyStores };
    } catch (error) {
      console.error('Asocial Background Worker: Error getting KeyStore list:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get writer keys from active KeyStore
   */
  async getWriterKeys() {
    try {
      if (!this.activeKeyStore || !this.derivedKey) {
        return [];
      }
      
      const keys = await this.keyManager.getWriterKeys(
        this.activeKeyStore.id, 
        this.derivedKey,
        this.activeKeyStore
      );
      
      return keys;
    } catch (error) {
      console.error('Asocial Background Worker: Error getting writer keys:', error);
      return [];
    }
  }

  /**
   * Get reader keys from active KeyStore
   */
  async getReaderKeys() {
    try {
      if (!this.activeKeyStore || !this.derivedKey) {
        return [];
      }
      
      const keys = await this.keyManager.getReaderKeys(
        this.activeKeyStore.id, 
        this.derivedKey,
        this.activeKeyStore
      );
      
      return keys;
    } catch (error) {
      console.error('Asocial Background Worker: Error getting reader keys:', error);
      return [];
    }
  }

  /**
   * Create new writer key
   */
  async createWriterKey(name) {
    try {
      console.log('Asocial Background Worker: Creating writer key:', name);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      const result = await this.keyManager.createWriterKey(
        name, 
        this.activeKeyStore.id, 
        this.derivedKey
      );
      
      if (result.success) {
        // Reload the active KeyStore to get the updated data
        const reloadResult = await this.keyStore.loadKeyStoreWithDerivedKey(
          this.activeKeyStore.id, 
          this.derivedKey
        );
        
        if (reloadResult.success) {
          this.activeKeyStore = reloadResult.keyStore;
          // Update storage
          await chrome.storage.local.set({ 
            asocial_active_keystore: this.activeKeyStore 
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Asocial Background Worker: Error creating writer key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add reader key from clipboard
   */
  async addReaderKey(name, privateKey) {
    try {
      console.log('Asocial Background Worker: Adding reader key:', name);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      const result = await this.keyManager.addReaderKeyFromClipboard(
        name, 
        privateKey, 
        this.activeKeyStore.id, 
        this.derivedKey
      );
      
      if (result.success) {
        // Reload the active KeyStore to get the updated data
        const reloadResult = await this.keyStore.loadKeyStoreWithDerivedKey(
          this.activeKeyStore.id, 
          this.derivedKey
        );
        
        if (reloadResult.success) {
          this.activeKeyStore = reloadResult.keyStore;
          // Update storage
          await chrome.storage.local.set({ 
            asocial_active_keystore: this.activeKeyStore 
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Asocial Background Worker: Error adding reader key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete key from KeyStore
   */
  async deleteKey(keyId) {
    try {
      console.log('Asocial Background Worker: Deleting key:', keyId);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      const result = await this.keyManager.deleteKey(
        this.activeKeyStore.id, 
        keyId, 
        this.derivedKey
      );
      
      if (result.success) {
        // Reload the active KeyStore to get the updated data
        const reloadResult = await this.keyStore.loadKeyStoreWithDerivedKey(
          this.activeKeyStore.id, 
          this.derivedKey
        );
        
        if (reloadResult.success) {
          this.activeKeyStore = reloadResult.keyStore;
          // Update storage
          await chrome.storage.local.set({ 
            asocial_active_keystore: this.activeKeyStore 
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Asocial Background Worker: Error deleting key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Encrypt message with writer key
   */
  async encryptMessage(text, writerKeyId) {
    try {
      console.log('Asocial Background Worker: Encrypting message with key:', writerKeyId);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      // Get writer key for encryption
      const keyResult = await this.keyManager.getWriterKeyForEncryption(
        this.activeKeyStore.id, 
        writerKeyId, 
        this.derivedKey
      );
      
      if (!keyResult.success) {
        return { success: false, error: keyResult.error };
      }
      
      // Encrypt message with writer key
      const encryptResult = await this.messageCrypto.encryptMessage(text, keyResult.key);
      
      if (encryptResult.success) {
        return { success: true, encryptedMessage: encryptResult.encryptedMessage };
      } else {
        return { success: false, error: encryptResult.error };
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error encrypting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt message with reader key
   */
  async decryptMessage(encryptedText) {
    try {
      console.log('Asocial Background Worker: Decrypting message');
      
      if (!this.activeKeyStore || !this.derivedKey) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      // Extract magic code from encrypted message
      const magicCode = this.messageCrypto.extractMagicCode(encryptedText);
      if (!magicCode) {
        return { success: false, error: 'Invalid encrypted message format' };
      }
      
      // Get reader key by magic code
      const readerKeys = await this.keyManager.getReaderKeys(this.activeKeyStore.id, this.derivedKey);
      const readerKey = this.messageCrypto.findReaderKeyByMagicCode(magicCode, readerKeys);
      
      if (!readerKey) {
        return { success: false, error: 'No reader key found for magic code' };
      }
      
      // Decrypt message with reader key
      const decryptResult = await this.messageCrypto.decryptMessage(encryptedText, readerKey);
      
      if (decryptResult.success) {
        return { success: true, decryptedMessage: decryptResult.message };
      } else {
        return { success: false, error: decryptResult.error };
      }
    } catch (error) {
      console.error('Asocial Background Worker: Error decrypting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export KeyStore to file
   */
  async exportKeyStore() {
    try {
      console.log('Asocial Background Worker: Exporting KeyStore');
      
      if (!this.activeKeyStore) {
        return { success: false, error: 'No active KeyStore' };
      }
      
      const result = await this.keyStore.exportKeyStore(
        this.activeKeyStore.id, 
        '' // We need the password for export
      );
      
      return result;
    } catch (error) {
      console.error('Asocial Background Worker: Error exporting KeyStore:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import KeyStore from file
   */
  async importKeyStore(keyStoreData, password) {
    try {
      console.log('Asocial Background Worker: Importing KeyStore');
      
      const result = await this.keyStore.importKeyStore(keyStoreData, password);
      
      if (result.success) {
        // Set as active KeyStore
        this.activeKeyStore = result.keyStore;
        this.keyStorePasswordHash = await this.crypto.hashData(password);
        
        // Store active KeyStore in memory
        await chrome.storage.local.set({ 
          asocial_active_keystore: this.activeKeyStore 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Asocial Background Worker: Error importing KeyStore:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize background worker
new AsocialBackgroundWorker();
