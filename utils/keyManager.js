/**
 * Asocial Key Manager
 * Manages encryption key groups and storage
 */

class AsocialKeyManager {
  constructor() {
    this.crypto = new AsocialCrypto();
    this.storageKey = 'asocial_keys';
    this.groupsKey = 'asocial_groups';
  }

  /**
   * Create a new encryption key group
   */
  async createKeyGroup(groupName, passphrase) {
    try {
      // Generate RSA-4096 key pair for this group
      const keyPair = await this.crypto.generateKeyPair();
      
      // Export keys
      const privateKeyBase64 = await this.crypto.exportKey(keyPair.privateKey, 'pkcs8');
      const publicKeyBase64 = await this.crypto.exportKey(keyPair.publicKey, 'spki');
      
      // Generate unique key ID based on multiple factors
      const timestamp = new Date().toISOString();
      const keyId = await this.generateKeyId('Storage', groupName, privateKeyBase64, timestamp);
      
      // Create group data
      const groupData = {
        id: this.generateGroupId(),
        keyId: keyId, // Unique short ID for key identification
        name: groupName,
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64,
        createdAt: timestamp,
      };
      
      // Store group
      await this.storeKeyGroup(groupData);
      
      console.log(`Key group "${groupName}" created successfully`);
      return groupData;
    } catch (error) {
      console.error('Failed to create key group:', error);
      throw new Error(`Failed to create key group: ${error.message}`);
    }
  }

  /**
   * Get all key groups
   */
  async getKeyGroups() {
    try {
      const groups = await this.getStoredKeyGroups();
      return groups || [];
    } catch (error) {
      console.error('Failed to get key groups:', error);
      return [];
    }
  }

  /**
   * Get specific key group by ID
   */
  async getKeyGroup(groupId) {
    try {
      const groups = await this.getStoredKeyGroups();
      return groups.find(group => group.id === groupId);
    } catch (error) {
      console.error('Failed to get key group:', error);
      return null;
    }
  }


  /**
   * Delete key group
   */
  async deleteKeyGroup(groupId) {
    try {
      const groups = await this.getStoredKeyGroups();
      const filteredGroups = groups.filter(g => g.id !== groupId);
      await this.storeKeyGroups(filteredGroups);
      
      console.log(`Key group deleted`);
    } catch (error) {
      console.error('Failed to delete key group:', error);
      throw new Error(`Failed to delete key group: ${error.message}`);
    }
  }


  /**
   * Export the single shared public key for this group
   */
  async exportGroupPublicKey(groupId) {
    try {
      const group = await this.getKeyGroup(groupId);
      if (!group) {
        throw new Error('Key group not found');
      }
      
      // Return the private key AND the key ID (the "magic")
      // Note: In a shared key system, we share the private key for decryption
      return {
        privateKey: group.privateKey,
        keyId: group.keyId,
        groupName: group.name,
        createdAt: group.createdAt
      };
    } catch (error) {
      console.error('Failed to export public key:', error);
      throw new Error(`Failed to export public key: ${error.message}`);
    }
  }

  /**
   * Import reader key (other person's private key for decrypting their messages)
   * This is independent of groups - you can import reader keys without having any groups
   */
  async importReaderKey(keyData) {
    try {
      console.log('Importing reader key');
      console.log('Key data length:', keyData.length);
      
      let privateKey, keyId, senderName;
      
      // Try to parse as JSON first (for structured key data)
      try {
        const importData = JSON.parse(keyData);
        console.log('Parsed JSON data:', importData);
        
        if (importData.privateKey) {
          privateKey = importData.privateKey;
          // Use storage name if available, otherwise fall back to group name
          senderName = importData.storageName || importData.groupName || importData.name || 'Unknown Sender';
          keyId = importData.keyId;
          if (keyId) {
            keyId = keyId.toUpperCase();
          }
          console.log('Parsed as JSON format with keyId:', keyId);
          console.log('Sender name from storage:', importData.storageName);
        } else {
          throw new Error('Invalid JSON format - missing privateKey');
        }
      } catch (jsonError) {
        // If JSON parsing fails, treat as raw base64 private key
        console.log('Not JSON format, treating as raw base64 private key');
        privateKey = keyData.trim();
        senderName = 'Unknown Sender';
        keyId = null; // No key ID for raw keys
        console.log('Raw key length:', privateKey.length);
      }
      
      // Validate the private key by trying to import it
      console.log('Validating reader private key...');
      await this.crypto.importKey(privateKey, 'private', ['decrypt']);
      console.log('Reader private key validation successful');
      
      // Store the reader key independently
      const readerKey = {
        id: this.generateReaderKeyId(),
        keyId: keyId,
        privateKey: privateKey,
        senderName: senderName,
        storageName: senderName, // Store the storage name for display
        importedAt: new Date().toISOString()
      };
      
      console.log(`Reader key imported successfully for ${senderName}`);
      return readerKey;
    } catch (error) {
      console.error('Failed to import reader key:', error);
      throw new Error(`Failed to import reader key: ${error.message}`);
    }
  }

  /**
   * Import key group public key from QR code data or raw base64 string
   */
  async importGroupPublicKey(keyData, groupName) {
    try {
      console.log('Importing key data:', keyData.substring(0, 50) + '...');
      console.log('Key data length:', keyData.length);
      
      let publicKey, groupNameFromData;
      
      let keyId;
      
      // Try to parse as JSON first (for QR code data)
      try {
        const importData = JSON.parse(keyData);
        console.log('Parsed JSON data:', importData);
        
        if (importData.privateKey) {
          publicKey = importData.privateKey; // We're importing the private key
          groupNameFromData = importData.groupName || importData.name || 'Imported Group';
          keyId = importData.keyId; // Get the key ID from the import data
          // Ensure key ID is uppercase for consistency
          if (keyId) {
            keyId = keyId.toUpperCase();
          }
          console.log('Parsed as JSON format with keyId:', keyId);
          console.log('Group name:', groupNameFromData);
        } else {
          throw new Error('Invalid JSON format - missing privateKey');
        }
      } catch (jsonError) {
        // If JSON parsing fails, treat as raw base64 public key
        console.log('Not JSON format, treating as raw base64 public key');
        publicKey = keyData.trim();
        groupNameFromData = groupName || 'Imported Group';
        keyId = null; // No key ID for raw keys
        console.log('Raw key length:', publicKey.length);
        console.log('Key starts with:', publicKey.substring(0, 20));
        console.log('Key ends with:', publicKey.substring(publicKey.length - 20));
      }
      
      // Validate the private key by trying to import it
      console.log('Validating private key...');
      await this.crypto.importKey(publicKey, 'private', ['decrypt']);
      console.log('Private key validation successful');
      
      return {
        groupName: groupNameFromData,
        publicKey: publicKey,
        keyId: keyId
      };
    } catch (error) {
      console.error('Failed to import public key:', error);
      throw new Error(`Failed to import public key: ${error.message}`);
    }
  }

  /**
   * Update group's public key (for importing keys from others)
   */
  async updateGroupPublicKey(groupId, newPublicKey, importData = null) {
    try {
      console.log(`Updating public key for group: ${groupId}`);
      console.log(`New public key length: ${newPublicKey.length}`);
      
      const groups = await this.getStoredKeyGroups();
      console.log(`Found ${groups.length} groups`);
      
      const groupIndex = groups.findIndex(g => g.id === groupId);
      console.log(`Group index: ${groupIndex}`);
      
      if (groupIndex === -1) {
        console.error('Group not found. Available groups:', groups.map(g => ({ id: g.id, name: g.name })));
        throw new Error('Group not found');
      }
      
      // Update the group's private key and key ID
      const oldKeyId = groups[groupIndex].keyId;
      groups[groupIndex].privateKey = newPublicKey; // We're actually storing the private key
      
            // Use the imported key ID if available, otherwise generate a new one
            if (importData && importData.keyId) {
              groups[groupIndex].keyId = importData.keyId.toUpperCase();
              console.log(`Using imported key ID: ${importData.keyId.toUpperCase()}`);
              console.log(`This means encrypted messages with key ID ${importData.keyId.toUpperCase()} can now be decrypted`);
            } else {
              groups[groupIndex].keyId = this.generateKeyId();
              console.log(`Generated new key ID: ${groups[groupIndex].keyId}`);
              console.log(`Note: This new key ID won't match existing encrypted messages`);
            }
      
      console.log(`Updated group ${groupId}: old keyId=${oldKeyId}, new keyId=${groups[groupIndex].keyId}`);
      
      // Store the updated groups
      await this.storeKeyGroups(groups);
      
      console.log(`Successfully updated public key for group ${groupId}`);
    } catch (error) {
      console.error('Failed to update group public key:', error);
      throw new Error(`Failed to update group public key: ${error.message}`);
    }
  }

  /**
   * Get private key for encryption
   */
  async getPrivateKeyForGroup(groupId) {
    try {
      const group = await this.getKeyGroup(groupId);
      if (!group) {
        throw new Error('Key group not found');
      }
      
      const privateKey = await this.crypto.importKey(
        group.privateKey, 
        'private', 
        ['decrypt']
      );
      
      return privateKey;
    } catch (error) {
      console.error('Failed to get private key:', error);
      throw new Error(`Failed to get private key: ${error.message}`);
    }
  }

  /**
   * Get public key for decryption
   */
  async getPublicKeyForGroup(groupId) {
    try {
      const group = await this.getKeyGroup(groupId);
      if (!group) {
        throw new Error('Key group not found');
      }
      
      const publicKey = await this.crypto.importKey(
        group.publicKey, 
        'public', 
        ['encrypt']
      );
      
      return publicKey;
    } catch (error) {
      console.error('Failed to get public key:', error);
      throw new Error(`Failed to get public key: ${error.message}`);
    }
  }

  /**
   * Store key groups in browser storage
   */
  async storeKeyGroups(groups) {
    try {
      await chrome.storage.local.set({ [this.groupsKey]: groups });
    } catch (error) {
      console.error('Failed to store key groups:', error);
      throw new Error('Failed to store key groups');
    }
  }

  /**
   * Get stored key groups from browser storage
   */
  async getStoredKeyGroups() {
    try {
      const result = await chrome.storage.local.get([this.groupsKey]);
      return result[this.groupsKey] || [];
    } catch (error) {
      console.error('Failed to get stored key groups:', error);
      return [];
    }
  }

  /**
   * Store key group
   */
  async storeKeyGroup(groupData) {
    try {
      const groups = await this.getStoredKeyGroups();
      groups.push(groupData);
      await this.storeKeyGroups(groups);
    } catch (error) {
      console.error('Failed to store key group:', error);
      throw new Error('Failed to store key group');
    }
  }

  /**
   * Generate unique group ID
   */
  generateGroupId() {
    return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate a unique key ID for a group based on multiple factors
   * Ensures 8+ billion combinations for uniqueness
   */
  async generateKeyId(storageName, groupName, privateKey, timestamp) {
    try {
      // Create a comprehensive input string from all factors
      const inputString = `${storageName}|${groupName}|${privateKey.substring(0, 64)}|${timestamp}`;
      
      // Use Web Crypto API to create a hash
      const encoder = new TextEncoder();
      const data = encoder.encode(inputString);
      
      // Create SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Take first 12 characters for 16^12 = 281 trillion combinations (well over 8 billion)
      // Convert to base36 for shorter, more readable format
      const keyId = this.hexToBase36(hashHex.substring(0, 12));
      
      console.log('Generated key ID:', keyId, 'from factors:', { storageName, groupName, timestamp });
      return keyId;
    } catch (error) {
      console.error('Failed to generate key ID:', error);
      // Fallback to random generation
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }

  /**
   * Convert hex string to base36 for shorter, more readable key IDs
   */
  hexToBase36(hexString) {
    // Convert hex to decimal
    const decimal = parseInt(hexString, 16);
    // Convert decimal to base36
    return decimal.toString(36).toUpperCase();
  }


  /**
   * Generate unique reader key ID
   */
  generateReaderKeyId() {
    return 'reader_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validate group name
   */
  validateGroupName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Group name cannot be empty' };
    }
    
    if (name.length > 50) {
      return { valid: false, error: 'Group name too long (max 50 characters)' };
    }
    
    return { valid: true };
  }


  /**
   * Store reader key in browser storage
   */
  async storeReaderKey(readerKey) {
    try {
      const readerKeys = await this.getStoredReaderKeys();
      readerKeys.push(readerKey);
      await chrome.storage.local.set({ asocial_reader_keys: readerKeys });
    } catch (error) {
      console.error('Failed to store reader key:', error);
      throw new Error('Failed to store reader key');
    }
  }

  /**
   * Get stored reader keys from browser storage
   */
  async getStoredReaderKeys() {
    try {
      const result = await chrome.storage.local.get(['asocial_reader_keys']);
      return result.asocial_reader_keys || [];
    } catch (error) {
      console.error('Failed to get stored reader keys:', error);
      return [];
    }
  }

  /**
   * Get all reader keys
   */
  async getReaderKeys() {
    try {
      return await this.getStoredReaderKeys();
    } catch (error) {
      console.error('Failed to get reader keys:', error);
      return [];
    }
  }

  /**
   * Get reader key by key ID (for decryption)
   */
  async getReaderKeyByKeyId(keyId) {
    try {
      const readerKeys = await this.getStoredReaderKeys();
      return readerKeys.find(key => key.keyId && key.keyId.toUpperCase() === keyId.toUpperCase());
    } catch (error) {
      console.error('Failed to get reader key by key ID:', error);
      return null;
    }
  }

  /**
   * Delete reader key
   */
  async deleteReaderKey(readerKeyId) {
    try {
      const readerKeys = await this.getStoredReaderKeys();
      const filteredKeys = readerKeys.filter(key => key.id !== readerKeyId);
      await chrome.storage.local.set({ asocial_reader_keys: filteredKeys });
    } catch (error) {
      console.error('Failed to delete reader key:', error);
      throw new Error('Failed to delete reader key');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialKeyManager;
} else {
  window.AsocialKeyManager = AsocialKeyManager;
}

