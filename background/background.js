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
    
    // Handle persistent connections from content scripts
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'content-port') {
        console.log('Asocial Background Worker: Content script connected');
        
        port.onMessage.addListener(async (message) => {
          try {
            console.log('=== BACKGROUND WORKER RECEIVED FROM CONTENT SCRIPT ===');
            console.log('Asocial Background Worker: Received message from content script:', message.action);
            console.log('Asocial Background Worker: Full message object:', message);
            console.log('Asocial Background Worker: Message type:', typeof message);
            console.log('Asocial Background Worker: Message keys:', Object.keys(message));
            console.log('=== END BACKGROUND WORKER RECEIVED ===');
            
            switch (message.action) {
              case 'getWriterKeys':
                console.log('=== BACKGROUND WORKER PROCESSING getWriterKeys ===');
                const writerKeys = await this.getWriterKeys();
                console.log('=== BACKGROUND WORKER SENDING TO CONTENT SCRIPT ===');
                console.log('Asocial Background Worker: Sending writer keys to content script:', writerKeys);
                console.log('Asocial Background Worker: Writer keys type:', typeof writerKeys);
                console.log('Asocial Background Worker: Writer keys is array:', Array.isArray(writerKeys));
                console.log('Asocial Background Worker: Writer keys length:', writerKeys?.length);
                if (writerKeys.length > 0) {
                  console.log('Asocial Background Worker: First writer key being sent:', writerKeys[0]);
                  console.log('Asocial Background Worker: First writer key fields:', Object.keys(writerKeys[0]));
                  console.log('Asocial Background Worker: First writer key has publicKey:', 'publicKey' in writerKeys[0]);
                  console.log('Asocial Background Worker: First writer key has privateKey:', 'privateKey' in writerKeys[0]);
                }
                console.log('=== END BACKGROUND WORKER SENDING ===');
                port.postMessage(writerKeys);
                break;
                
              case 'encryptMessage':
                console.log('=== BACKGROUND WORKER PROCESSING encryptMessage ===');
                console.log('Asocial Background Worker: - Text:', message.text);
                console.log('Asocial Background Worker: - Text length:', message.text?.length);
                console.log('Asocial Background Worker: - Writer Key ID:', message.writerKeyId);
                const encryptResult = await this.encryptMessage(message.text, message.writerKeyId);
                console.log('=== BACKGROUND WORKER SENDING ENCRYPTION RESULT ===');
                console.log('Asocial Background Worker: Encryption result:', encryptResult);
                console.log('Asocial Background Worker: Result success:', encryptResult.success);
                console.log('Asocial Background Worker: Result error:', encryptResult.error);
                console.log('Asocial Background Worker: Result encryptedMessage length:', encryptResult.encryptedMessage?.length);
                console.log('=== END BACKGROUND WORKER SENDING ENCRYPTION ===');
                port.postMessage(encryptResult);
                break;
                
              default:
                console.log('Asocial Background Worker: Unknown action from content script:', message.action);
                port.postMessage({ success: false, error: 'Unknown action' });
            }
          } catch (error) {
            console.error('Asocial Background Worker: Error handling content script message:', error);
            port.postMessage({ success: false, error: error.message });
          }
        });
        
        port.onDisconnect.addListener(() => {
          console.log('Asocial Background Worker: Content script disconnected');
        });
      }
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
          sendResponse(writerKeys);
          break;
          
        case 'getReaderKeys':
          const readerKeys = await this.getReaderKeys();
          sendResponse(readerKeys);
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
          const decryptResult = await this.decryptMessage(message.magicCode, message.encryptedPayload);
          sendResponse(decryptResult);
          break;
          
        case 'exportKeyStore':
          const exportResult = await this.exportKeyStore();
          sendResponse(exportResult);
          break;
          
        case 'exportKeyStoreData':
          const exportDataResult = await this.exportKeyStoreData(message.keyStoreId);
          sendResponse(exportDataResult);
          break;
          
        case 'importKeyStore':
          const importResult = await this.importKeyStore(message.keyStoreData);
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
        // Only set as active if we have a valid derived key (authenticated)
        if (this.derivedKey) {
          this.activeKeyStore = result.asocial_active_keystore;
          console.log('Asocial Background Worker: Active KeyStore loaded:', this.activeKeyStore.name);
        } else {
          // No derived key means session expired, clear the active KeyStore
          console.log('Asocial Background Worker: KeyStore found but no derived key - session expired');
          this.activeKeyStore = null;
          await chrome.storage.local.remove(['asocial_active_keystore']);
        }
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
        
        // COMPREHENSIVE KEYSTORE MEMORY DUMP
        console.log('=== KEYSTORE MEMORY DUMP ===');
        console.log('Asocial Background Worker: Active KeyStore ID:', this.activeKeyStore.id);
        console.log('Asocial Background Worker: Active KeyStore Name:', this.activeKeyStore.name);
        console.log('Asocial Background Worker: Active KeyStore Description:', this.activeKeyStore.description);
        console.log('Asocial Background Worker: Active KeyStore Created:', this.activeKeyStore.createdAt);
        console.log('Asocial Background Worker: Writer Keys Count:', this.activeKeyStore.writerKeys?.length || 0);
        console.log('Asocial Background Worker: Reader Keys Count:', this.activeKeyStore.readerKeys?.length || 0);
        
        if (this.activeKeyStore.writerKeys && this.activeKeyStore.writerKeys.length > 0) {
          console.log('=== WRITER KEYS DUMP ===');
          this.activeKeyStore.writerKeys.forEach((key, index) => {
            console.log(`Writer Key ${index}:`, {
              id: key.id,
              name: key.name,
              type: key.type,
              createdAt: key.createdAt,
              hasPublicKey: 'publicKey' in key,
              publicKeyType: typeof key.publicKey,
              publicKeyValue: key.publicKey,
              allFields: Object.keys(key)
            });
          });
        }
        
        if (this.activeKeyStore.readerKeys && this.activeKeyStore.readerKeys.length > 0) {
          console.log('=== READER KEYS DUMP ===');
          this.activeKeyStore.readerKeys.forEach((key, index) => {
            console.log(`Reader Key ${index}:`, {
              id: key.id,
              name: key.name,
              type: key.type,
              createdAt: key.createdAt,
              hasPrivateKey: 'privateKey' in key,
              privateKeyType: typeof key.privateKey,
              magicCode: key.magicCode,
              allFields: Object.keys(key)
            });
          });
        }
        
        console.log('=== END KEYSTORE MEMORY DUMP ===');
        
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
          console.log('Asocial Background Worker: KeyStore metadata:', value);
          keyStores.push({
            id: keystoreId,
            name: value.name,
            description: value.description,
            createdAt: value.createdAt
          });
        } else if (key.startsWith('asocial_keystore_') && key.endsWith('_meta')) {
          console.log('Asocial Background Worker: KeyStore metadata found but missing name:', key, value);
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
      if (!this.activeKeyStore) {
        console.log('Asocial Background Worker: No active KeyStore');
        return [];
      }
      
      if (!this.derivedKey) {
        console.log('Asocial Background Worker: KeyStore loaded but no derived key - session expired');
        // Clear the active KeyStore since we can't use it without the derived key
        this.activeKeyStore = null;
        await chrome.storage.local.remove(['asocial_active_keystore']);
        return [];
      }
      
      const keys = await this.keyManager.getWriterKeys(
        this.activeKeyStore.id, 
        this.derivedKey,
        this.activeKeyStore
      );
      
      console.log('Asocial Background Worker: Retrieved writer keys:', keys.length);
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
      if (!this.activeKeyStore) {
        console.log('Asocial Background Worker: No active KeyStore');
        return [];
      }
      
      if (!this.derivedKey) {
        console.log('Asocial Background Worker: KeyStore loaded but no derived key - session expired');
        // Clear the active KeyStore since we can't use it without the derived key
        this.activeKeyStore = null;
        await chrome.storage.local.remove(['asocial_active_keystore']);
        return [];
      }
      
      const keys = await this.keyManager.getReaderKeys(
        this.activeKeyStore.id, 
        this.derivedKey,
        this.activeKeyStore
      );
      
      console.log('Asocial Background Worker: Retrieved reader keys:', keys.length);
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
        this.derivedKey,
        this.activeKeyStore
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
      
      // Get the specific writer key by ID from the already loaded KeyStore
      console.log('Asocial Background Worker: Looking for writer key with ID:', writerKeyId);
      console.log('Asocial Background Worker: Available writer keys in memory:', this.activeKeyStore.writerKeys?.length || 0);
      
      // Find the encrypted writer key in memory
      const encryptedWriterKey = this.activeKeyStore.writerKeys?.find(key => key.id === writerKeyId);
      
      if (!encryptedWriterKey) {
        console.log('Asocial Background Worker: Writer key not found in memory');
        return { success: false, error: 'Writer key not found' };
      }
      
      console.log('Asocial Background Worker: Found encrypted writer key:', encryptedWriterKey.id);
      
      // Decrypt the specific writer key
      const decryptedKeyData = await this.crypto.decryptData(
        {
          data: this.crypto.base64ToArrayBuffer(encryptedWriterKey.encryptedData),
          iv: this.crypto.base64ToArrayBuffer(encryptedWriterKey.iv),
          tag: this.crypto.base64ToArrayBuffer(encryptedWriterKey.tag)
        },
        this.derivedKey
      );
      
      const writerKey = JSON.parse(decryptedKeyData);
      console.log('Asocial Background Worker: Decrypted writer key:', writerKey);
      
      console.log('Asocial Background Worker: Using decrypted writer key:', writerKey.name);
      console.log('Asocial Background Worker: Writer key object:', writerKey);
      console.log('Asocial Background Worker: Public key type:', typeof writerKey.publicKey);
      console.log('Asocial Background Worker: Public key value:', writerKey.publicKey);
      
      // Encrypt message with writer key
      const encryptResult = await this.messageCrypto.encryptMessage(text, writerKey);
      
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
  async decryptMessage(magicCode, encryptedPayload) {
    try {
      console.log('Asocial Background Worker: Decrypting message');
      console.log('Asocial Background Worker: Magic code:', magicCode);
      console.log('Asocial Background Worker: Encrypted payload length:', encryptedPayload.length);
      
      if (!this.activeKeyStore || !this.derivedKey) {
        console.log('Asocial Background Worker: No active KeyStore or derived key');
        return { success: false, error: 'No active KeyStore' };
      }
      
      if (!magicCode || !encryptedPayload) {
        return { success: false, error: 'Missing magic code or encrypted payload' };
      }
      
      // Get reader key by magic code - decrypt keys from already loaded KeyStore
      console.log('Asocial Background Worker: Getting reader keys from memory...');
      const readerKeys = await this.keyStore.getDecryptedKeys(this.activeKeyStore.id, this.derivedKey, 'reader', this.activeKeyStore);
      console.log('Asocial Background Worker: Found reader keys:', readerKeys.length);
      console.log('Asocial Background Worker: Reader key magic codes:', readerKeys.map(k => k.magicCode));
      
      const readerKey = this.messageCrypto.findReaderKeyByMagicCode(magicCode, readerKeys);
      console.log('Asocial Background Worker: Found matching reader key:', readerKey ? readerKey.name : 'None');
      
      if (!readerKey) {
        return { success: false, error: 'No reader key found for magic code' };
      }
      
      // Decrypt message with reader key
      const decryptResult = await this.messageCrypto.decryptMessage(magicCode, encryptedPayload, readerKey);
      
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
   * Export KeyStore data (encrypted) without decryption
   */
  async exportKeyStoreData(keyStoreId) {
    try {
      console.log('Asocial Background Worker: Exporting KeyStore data:', keyStoreId);
      
      // Get the encrypted KeyStore data and metadata from storage
      const storageKey = 'asocial_keystore_' + keyStoreId;
      const metaKey = 'asocial_keystore_' + keyStoreId + '_meta';
      const result = await chrome.storage.local.get([storageKey, metaKey]);
      
      if (!result[storageKey]) {
        return { success: false, error: 'KeyStore not found in storage' };
      }
      
      if (!result[metaKey]) {
        return { success: false, error: 'KeyStore metadata not found in storage' };
      }
      
      // Combine encrypted data with metadata for export
      const exportData = {
        encryptedData: result[storageKey],
        metadata: result[metaKey]
      };
      
      // Return the combined data as JSON string
      const keyStoreData = JSON.stringify(exportData, null, 2);
      
      return {
        success: true,
        keyStoreData: keyStoreData
      };
    } catch (error) {
      console.error('Asocial Background Worker: Error exporting KeyStore data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import KeyStore from file
   */
  async importKeyStore(keyStoreData) {
    try {
      console.log('Asocial Background Worker: Importing KeyStore');
      
      // Generate new KeyStore ID
      const keyStoreId = this.crypto.generateKeyId();
      
      // Store the imported KeyStore data directly
      const storageKey = 'asocial_keystore_' + keyStoreId;
      const metaKey = 'asocial_keystore_' + keyStoreId + '_meta';
      
      // Extract encrypted data and metadata from import
      const encryptedData = keyStoreData.encryptedData || keyStoreData;
      const metadata = keyStoreData.metadata || {};
      
      // Update the KeyStore data with new ID
      encryptedData.id = keyStoreId;
      encryptedData.createdAt = new Date().toISOString();
      
      console.log('Asocial Background Worker: Imported KeyStore data:', encryptedData);
      console.log('Asocial Background Worker: KeyStore metadata:', metadata);
      console.log('Asocial Background Worker: KeyStore name:', metadata.name);
      console.log('Asocial Background Worker: KeyStore description:', metadata.description);
      
      // Store the KeyStore data
      await chrome.storage.local.set({
        [storageKey]: encryptedData,
        [metaKey]: {
          id: keyStoreId,
          name: metadata.name || 'Imported KeyStore',
          description: metadata.description || 'Imported from file',
          createdAt: encryptedData.createdAt
        }
      });
      
      console.log('Asocial Background Worker: Stored KeyStore with keys:', storageKey, metaKey);
      
      console.log('Asocial Background Worker: KeyStore imported successfully');
      return { 
        success: true, 
        keyStore: {
          id: keyStoreId,
          name: keyStoreData.name,
          description: keyStoreData.description,
          createdAt: keyStoreData.createdAt
        }
      };
    } catch (error) {
      console.error('Asocial Background Worker: Error importing KeyStore:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize background worker
new AsocialBackgroundWorker();
