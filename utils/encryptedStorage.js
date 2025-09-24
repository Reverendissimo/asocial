/**
 * Asocial Encrypted Storage Manager
 * Handles encrypted .ASoc file storage with multi-user support
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
      console.log('isLoggedIn check - storage key:', this.storageKey);
      console.log('isLoggedIn check - result:', result);
      console.log('isLoggedIn check - value:', result[this.storageKey]);
      console.log('isLoggedIn check - is null:', result[this.storageKey] === null);
      console.log('isLoggedIn check - is undefined:', result[this.storageKey] === undefined);
      
      const isLoggedIn = result[this.storageKey] !== null && result[this.storageKey] !== undefined;
      console.log('isLoggedIn check - final result:', isLoggedIn);
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
      console.log('setCurrentUser called with:', username);
      console.log('Storage key:', this.storageKey);
      
      await chrome.storage.local.set({ [this.storageKey]: username });
      this.currentUser = username;
      
      // Verify the user was set
      const verification = await chrome.storage.local.get([this.storageKey]);
      console.log('setCurrentUser verification:', verification);
      console.log('setCurrentUser verification value:', verification[this.storageKey]);
    } catch (error) {
      console.error('Failed to set current user:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await chrome.storage.local.remove([this.storageKey]);
      this.currentUser = null;
      this.currentStorage = null;
      this.currentPassword = null; // Clear stored password
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }

  /**
   * Create new encrypted storage file
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
      
      // Create empty encrypted storage
      const storageData = {
        version: '1.0',
        storageName: storageName,
        createdAt: new Date().toISOString(),
        writerKeys: [],
        readerKeys: []
      };
      
      // Encrypt storage data
      const encryptedData = await this.encryptStorageData(storageData, storageName, password);
      
      // Store encrypted data
      await this.storeEncryptedFile(filename, encryptedData);
      
      // Add to storage files list
      await this.addStorageFileToList(filename, storageName);
      
      // Set current storage for immediate use
      this.currentStorage = storageData;
      this.currentUser = storageName;
      this.currentPassword = password; // Store password for saving
      
      console.log(`Created encrypted storage: ${storageName}`);
      return filename;
    } catch (error) {
      console.error('Failed to create storage:', error);
      throw error;
    }
  }

  /**
   * Open encrypted storage file
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
      
      // Get encrypted data
      let encryptedData = await this.getEncryptedFile(filename);
      if (!encryptedData) {
        throw new Error('Storage file not found');
      }
      
      console.log('Retrieved encrypted data type:', typeof encryptedData);
      console.log('Is string:', typeof encryptedData === 'string');
      console.log('Is array:', Array.isArray(encryptedData));
      console.log('Has length:', encryptedData && typeof encryptedData.length !== 'undefined');
      
      if (typeof encryptedData === 'string') {
        console.log('Data length:', encryptedData.length);
        console.log('First 100 chars:', encryptedData.substring(0, 100));
      } else {
        console.log('Data value:', encryptedData);
        console.log('Data keys:', Object.keys(encryptedData || {}));
      }
      
      // Ensure data is a string
      if (typeof encryptedData !== 'string') {
        console.log('Data is not a string, attempting to convert...');
        console.log('Data type:', typeof encryptedData);
        console.log('Data value:', encryptedData);
        
        // Try to convert object to string
        if (typeof encryptedData === 'object' && encryptedData !== null) {
          console.log('Object type:', encryptedData.constructor.name);
          console.log('Object keys:', Object.keys(encryptedData));
          console.log('Object values:', Object.values(encryptedData));
          
          // Try different conversion methods
          let convertedData;
          if (encryptedData.toString && encryptedData.toString() !== '[object Object]') {
            convertedData = encryptedData.toString();
            console.log('Using toString() method');
          } else if (JSON.stringify) {
            convertedData = JSON.stringify(encryptedData);
            console.log('Using JSON.stringify() method');
          } else {
            throw new Error(`Cannot convert object to string: ${encryptedData.constructor.name}`);
          }
          
          console.log('Converted to string length:', convertedData.length);
          console.log('Converted to string preview:', convertedData.substring(0, 50));
          console.log('Converted to string ends with:', convertedData.substring(convertedData.length - 20));
          
          // Check if the converted data is valid base64
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(convertedData)) {
            console.error('Converted data is not valid base64');
            console.log('Invalid characters:', convertedData.replace(/[A-Za-z0-9+/=]/g, ''));
            console.log('This suggests the data was corrupted during storage');
            console.log('The storage file may be corrupted and needs to be recreated');
            
            // Try to clean up the corrupted storage file
            const filename = `asocial_storage_${storageName}.ASoc`;
            console.log('Attempting to clean up corrupted storage file:', filename);
            await this.cleanupCorruptedStorage(filename);
            
            throw new Error('Storage file was corrupted and has been deleted. Please create a new storage.');
          }
          
          encryptedData = convertedData;
        } else {
          throw new Error(`Invalid data format: expected string, got ${typeof encryptedData}`);
        }
      }
      
      // Decrypt storage data
      const storageData = await this.decryptStorageData(encryptedData, storageName, password);
      
      // Validate storage data
      if (!storageData || storageData.storageName !== storageName) {
        throw new Error('Invalid storage data or wrong password');
      }
      
      // Set current storage
      this.currentStorage = storageData;
      this.currentUser = storageName;
      this.currentPassword = password; // Store password for saving
      
      // Update current user
      await this.setCurrentUser(storageName);
      
      console.log(`Opened encrypted storage: ${storageName}`);
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
      
      // Re-encrypt the storage data with the stored password
      if (this.currentPassword) {
        console.log('Re-encrypting storage data with password...');
        const encryptedData = await this.encryptStorageData(this.currentStorage, this.currentUser, this.currentPassword);
        console.log('Encrypted data length:', encryptedData.length);
        console.log('Encrypted data preview:', encryptedData.substring(0, 50));
        
        // Use a more robust prefix to prevent Chrome JSON parsing
        const prefixedData = 'ASOCIAL_ENCRYPTED_DATA:' + encryptedData;
        console.log('Prefixed data length:', prefixedData.length);
        console.log('Prefixed data preview:', prefixedData.substring(0, 50));
        
        await chrome.storage.local.set({ [filename]: prefixedData });
        console.log('Storage data re-encrypted and saved with prefix');
        
        // Verify the data was stored correctly
        const verifyResult = await chrome.storage.local.get([filename]);
        const storedData = verifyResult[filename];
        console.log('Verification - stored data type:', typeof storedData);
        console.log('Verification - stored data length:', storedData ? storedData.length : 'undefined');
        console.log('Verification - stored data preview:', storedData ? storedData.substring(0, 50) : 'undefined');
      } else {
        console.log('No password available, saving in plain format...');
        // Fallback to plain storage if no password available
        const stringData = 'ASOCIAL_PLAIN_DATA:' + JSON.stringify(this.currentStorage);
        console.log('Plain data length:', stringData.length);
        await chrome.storage.local.set({ [filename]: stringData });
        console.log('Storage data saved in plain format with prefix (no password available)');
      }
      
      console.log(`Saved storage for user: ${this.currentUser} to file: ${filename}`);
    } catch (error) {
      console.error('Failed to save storage:', error);
      throw error;
    }
  }

  /**
   * Get list of available storage files
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
      const existingFile = files.find(f => f.filename === filename);
      
      if (!existingFile) {
        files.push({
          filename: filename,
          username: username,
          createdAt: new Date().toISOString()
        });
        
        await chrome.storage.local.set({ [this.storageFilesKey]: files });
      }
    } catch (error) {
      console.error('Failed to add storage file to list:', error);
      throw error;
    }
  }

  /**
   * Encrypt storage data
   */
  async encryptStorageData(data, username, password) {
    try {
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Derive encryption key from username and password
      const encryptionKey = await this.deriveKey(username, password);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data with AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        encryptionKey,
        new TextEncoder().encode(jsonData)
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Return as base64
      const binaryString = Array.from(combined, byte => String.fromCharCode(byte)).join('');
      console.log('Binary string length:', binaryString.length);
      console.log('Binary string preview:', binaryString.substring(0, 50));
      
      const base64Result = btoa(binaryString);
      console.log('Base64 result length:', base64Result.length);
      console.log('Base64 result preview:', base64Result.substring(0, 50));
      console.log('Base64 result ends with:', base64Result.substring(base64Result.length - 20));
      
      // Validate the base64 encoding
      try {
        const testDecode = atob(base64Result);
        console.log('Base64 encoding validation successful');
        console.log('Decoded length:', testDecode.length);
        console.log('Decoded preview:', testDecode.substring(0, 50));
      } catch (validationError) {
        console.error('Base64 encoding validation failed:', validationError);
        console.log('Failed base64 data preview:', base64Result.substring(0, 100));
        console.log('Failed base64 data length:', base64Result.length);
        throw new Error('Failed to create valid base64 data');
      }
      
      return base64Result;
    } catch (error) {
      console.error('Failed to encrypt storage data:', error);
      throw error;
    }
  }

  /**
   * Decrypt storage data
   */
  async decryptStorageData(encryptedData, username, password) {
    try {
      // Validate base64 data
      if (!encryptedData) {
        throw new Error('No encrypted data provided');
      }
      
      // Handle different data types
      let dataString;
      if (typeof encryptedData === 'string') {
        dataString = encryptedData;
      } else if (typeof encryptedData === 'object' && encryptedData !== null) {
        // Try to convert object to string
        if (encryptedData.toString) {
          dataString = encryptedData.toString();
        } else if (JSON.stringify) {
          dataString = JSON.stringify(encryptedData);
        } else {
          throw new Error('Cannot convert encrypted data to string');
        }
      } else {
        throw new Error(`Invalid encrypted data format: ${typeof encryptedData}`);
      }
      
      // Validate base64 data before decoding
      console.log('Base64 data length:', dataString.length);
      console.log('Base64 data preview:', dataString.substring(0, 100));
      console.log('Base64 data ends with:', dataString.substring(dataString.length - 20));
      
      // Check if data contains valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(dataString)) {
        console.error('Invalid base64 characters found');
        const invalidChars = dataString.replace(/[A-Za-z0-9+/=]/g, '');
        console.log('Invalid characters:', invalidChars);
        console.log('Invalid character codes:', Array.from(invalidChars).map(c => c.charCodeAt(0)));
        console.log('Data length:', dataString.length);
        console.log('Data preview:', dataString.substring(0, 100));
        console.log('Data middle:', dataString.substring(dataString.length/2 - 50, dataString.length/2 + 50));
        console.log('Data end:', dataString.substring(dataString.length - 100));
        throw new Error('Data contains invalid base64 characters');
      }
      
      // Convert from base64 to Uint8Array
      let binaryString;
      try {
        binaryString = atob(dataString);
        console.log('Base64 decoding successful, binary length:', binaryString.length);
      } catch (atobError) {
        console.error('Base64 decoding failed:', atobError);
        console.log('Failed data preview:', dataString.substring(0, 200));
        
        // Try to clean up the corrupted storage
        console.log('Attempting to clean up corrupted storage...');
        try {
          await this.cleanupCorruptedStorage(filename);
          console.log('Corrupted storage cleaned up');
        } catch (cleanupError) {
          console.error('Failed to clean up corrupted storage:', cleanupError);
        }
        
        throw new Error('Invalid base64 data: ' + atobError.message);
      }
      
      const combined = Uint8Array.from(binaryString, c => c.charCodeAt(0));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Derive decryption key
      const decryptionKey = await this.deriveKey(username, password);
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        decryptionKey,
        encrypted
      );
      
      // Convert back to JSON
      const jsonData = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to decrypt storage data:', error);
      throw error;
    }
  }

  /**
   * Derive encryption key from username and password
   */
  async deriveKey(username, password) {
    try {
      // Create salt from username
      const salt = new TextEncoder().encode(username);
      
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive key using PBKDF2
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      return key;
    } catch (error) {
      console.error('Failed to derive key:', error);
      throw error;
    }
  }

  /**
   * Store encrypted file
   */
  async storeEncryptedFile(filename, encryptedData) {
    try {
      console.log('Storing encrypted file:', filename);
      console.log('Data type:', typeof encryptedData);
      console.log('Data length:', encryptedData.length);
      console.log('Is string:', typeof encryptedData === 'string');
      
      // Ensure data is stored as string by adding a prefix to prevent JSON parsing
      const stringData = 'ASOCIAL_ENCRYPTED_DATA:' + encryptedData;
      console.log('String data length:', stringData.length);
      console.log('String data preview:', stringData.substring(0, 50));
      
      await chrome.storage.local.set({ [filename]: stringData });
      
      // Verify storage
      const result = await chrome.storage.local.get([filename]);
      const storedData = result[filename];
      console.log('Verification - stored data type:', typeof storedData);
      console.log('Verification - stored data length:', storedData ? storedData.length : 'undefined');
      console.log('Verification - is string:', typeof storedData === 'string');
      console.log('Verification - starts with prefix:', storedData ? storedData.startsWith('ASOCIAL_ENCRYPTED_DATA:') : false);
      console.log('Verification - data preview:', storedData ? storedData.substring(0, 50) : 'undefined');
      
      // Check if data was corrupted during storage
      if (typeof storedData !== 'string') {
        console.error('Data was corrupted during storage - not a string!');
        console.log('Corrupted data type:', typeof storedData);
        console.log('Corrupted data value:', storedData);
        throw new Error('Data corruption detected during storage');
      }
      
      if (!storedData.startsWith('ASOCIAL_ENCRYPTED_DATA:')) {
        console.error('Data was corrupted during storage - missing prefix!');
        console.log('Expected prefix: ASOCIAL_ENCRYPTED_DATA:');
        console.log('Actual start:', storedData.substring(0, 25));
        throw new Error('Data corruption detected - prefix missing');
      }
    } catch (error) {
      console.error('Failed to store encrypted file:', error);
      throw error;
    }
  }

  /**
   * Get encrypted file
   */
  async getEncryptedFile(filename) {
    try {
      console.log('Retrieving encrypted file:', filename);
      const result = await chrome.storage.local.get([filename]);
      const data = result[filename];
      console.log('Retrieved data type:', typeof data);
      console.log('Retrieved data exists:', data !== undefined);
      if (data) {
        console.log('Retrieved data length:', data.length);
        console.log('Is string:', typeof data === 'string');
        console.log('Data preview:', typeof data === 'string' ? data.substring(0, 50) : data);
        
        // Remove the prefix if it exists
        if (typeof data === 'string' && data.startsWith('ASOCIAL_ENCRYPTED_DATA:')) {
          const cleanData = data.substring(22); // Remove 'ASOCIAL_ENCRYPTED_DATA:' prefix
          console.log('Removed encrypted prefix, clean data length:', cleanData.length);
          console.log('Clean data preview:', cleanData.substring(0, 50));
          return cleanData;
        } else if (typeof data === 'string' && data.startsWith('ASOCIAL_PLAIN_DATA:')) {
          const cleanData = data.substring(18); // Remove 'ASOCIAL_PLAIN_DATA:' prefix
          console.log('Removed plain prefix, clean data length:', cleanData.length);
          console.log('Clean data preview:', cleanData.substring(0, 50));
          return cleanData;
        } else if (typeof data === 'string' && data.startsWith('ASOC_DATA:')) {
          // Handle old format for backward compatibility
          const cleanData = data.substring(10); // Remove 'ASOC_DATA:' prefix
          console.log('Removed old prefix, clean data length:', cleanData.length);
          console.log('Clean data preview:', cleanData.substring(0, 50));
          return cleanData;
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to get encrypted file:', error);
      return null;
    }
  }

  /**
   * Test if storage file is valid
   */
  async testStorageFile(filename) {
    try {
      const encryptedData = await this.getEncryptedFile(filename);
      if (!encryptedData) {
        return { valid: false, error: 'File not found' };
      }
      
      // Check if data is string
      if (typeof encryptedData !== 'string') {
        return { valid: false, error: `Invalid data type: ${typeof encryptedData}` };
      }
      
      // Try to decode as base64
      try {
        atob(encryptedData);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: 'Invalid base64: ' + error.message };
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
   * Remove storage file from files list
   */
  async removeStorageFileFromList(filename) {
    try {
      const result = await chrome.storage.local.get([this.storageFilesKey]);
      const files = result[this.storageFilesKey] || [];
      
      const updatedFiles = files.filter(file => file.filename !== filename);
      
      await chrome.storage.local.set({ [this.storageFilesKey]: updatedFiles });
      console.log('Storage file removed from files list');
    } catch (error) {
      console.error('Failed to remove storage file from list:', error);
    }
  }

  /**
   * Validate credentials
   */
  validateCredentials(username, password) {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    if (username.length < 2) {
      throw new Error('Username must be at least 2 characters long');
    }
    
    if (username.length > 50) {
      throw new Error('Username must be less than 50 characters');
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      throw new Error('Password must be less than 128 characters');
    }
    
    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
    }
  }

  /**
   * Get current password (placeholder - needs secure implementation)
   */
  async getCurrentPassword() {
    // This is a placeholder - in a real implementation, we'd need a secure way
    // to store and retrieve the password for the current session
    // For now, we'll need to implement a secure password manager
    throw new Error('Password retrieval not implemented yet');
  }

  /**
   * Get writer keys from current storage
   */
  async getWriterKeys() {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    return this.currentStorage.writerKeys || [];
  }

  /**
   * Get reader keys from current storage
   */
  async getReaderKeys() {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    return this.currentStorage.readerKeys || [];
  }

  /**
   * Add writer key to current storage
   */
  async addWriterKey(writerKey) {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    
    console.log('Adding writer key to storage:', writerKey.id);
    this.currentStorage.writerKeys.push(writerKey);
    console.log('Total writer keys after add:', this.currentStorage.writerKeys.length);
    await this.saveStorage();
    console.log('Writer key saved to storage successfully');
  }

  /**
   * Add reader key to current storage
   */
  async addReaderKey(readerKey) {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    
    console.log('Adding reader key to storage:', readerKey.id);
    this.currentStorage.readerKeys.push(readerKey);
    console.log('Total reader keys after add:', this.currentStorage.readerKeys.length);
    await this.saveStorage();
    console.log('Reader key saved to storage successfully');
  }

  /**
   * Delete writer key from current storage
   */
  async deleteWriterKey(writerKeyId) {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    
    console.log('Deleting writer key:', writerKeyId);
    this.currentStorage.writerKeys = this.currentStorage.writerKeys.filter(
      key => key.id !== writerKeyId
    );
    console.log('Total writer keys after delete:', this.currentStorage.writerKeys.length);
    await this.saveStorage();
    console.log('Writer key deleted and storage saved');
  }

  /**
   * Delete reader key from current storage
   */
  async deleteReaderKey(readerKeyId) {
    if (!this.currentStorage) {
      throw new Error('No storage open');
    }
    
    console.log('Deleting reader key:', readerKeyId);
    this.currentStorage.readerKeys = this.currentStorage.readerKeys.filter(
      key => key.id !== readerKeyId
    );
    console.log('Total reader keys after delete:', this.currentStorage.readerKeys.length);
    await this.saveStorage();
    console.log('Reader key deleted and storage saved');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialEncryptedStorage;
} else {
  window.AsocialEncryptedStorage = AsocialEncryptedStorage;
}
