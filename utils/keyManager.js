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
      
      // Generate unique key ID for this group
      const keyId = this.generateKeyId();
      
      // Create group data
      const groupData = {
        id: this.generateGroupId(),
        keyId: keyId, // Unique short ID for key identification
        name: groupName,
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64,
        createdAt: new Date().toISOString(),
        contacts: []
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
   * Add contact to key group (just name, no individual key needed)
   */
  async addContactToGroup(groupId, contactName) {
    try {
      const groups = await this.getStoredKeyGroups();
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error('Key group not found');
      }
      
      const contact = {
        id: this.generateContactId(),
        name: contactName,
        addedAt: new Date().toISOString()
      };
      
      group.contacts.push(contact);
      await this.storeKeyGroups(groups);
      
      console.log(`Contact "${contactName}" added to group "${group.name}"`);
      return contact;
    } catch (error) {
      console.error('Failed to add contact to group:', error);
      throw new Error(`Failed to add contact: ${error.message}`);
    }
  }

  /**
   * Remove contact from key group
   */
  async removeContactFromGroup(groupId, contactId) {
    try {
      const groups = await this.getStoredKeyGroups();
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error('Key group not found');
      }
      
      group.contacts = group.contacts.filter(c => c.id !== contactId);
      await this.storeKeyGroups(groups);
      
      console.log(`Contact removed from group "${group.name}"`);
    } catch (error) {
      console.error('Failed to remove contact from group:', error);
      throw new Error(`Failed to remove contact: ${error.message}`);
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
      
      // Return both the public key AND the key ID (the "magic")
      return {
        publicKey: group.publicKey,
        keyId: group.keyId,
        groupName: group.name
      };
    } catch (error) {
      console.error('Failed to export public key:', error);
      throw new Error(`Failed to export public key: ${error.message}`);
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
        
        if (importData.publicKey) {
          publicKey = importData.publicKey;
          groupNameFromData = importData.groupName || importData.name || 'Imported Group';
          keyId = importData.keyId; // Get the key ID from the import data
          console.log('Parsed as JSON format with keyId:', keyId);
          console.log('Group name:', groupNameFromData);
        } else {
          throw new Error('Invalid JSON format - missing publicKey');
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
      
      // Validate the public key by trying to import it
      console.log('Validating public key...');
      await this.crypto.importKey(publicKey, 'public', ['encrypt']);
      console.log('Public key validation successful');
      
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
      
      // Update the group's public key and key ID
      const oldKeyId = groups[groupIndex].keyId;
      groups[groupIndex].publicKey = newPublicKey;
      
      // Use the imported key ID if available, otherwise generate a new one
      if (importData && importData.keyId) {
        groups[groupIndex].keyId = importData.keyId;
        console.log(`Using imported key ID: ${importData.keyId}`);
        console.log(`This means encrypted messages with key ID ${importData.keyId} can now be decrypted`);
      } else {
        groups[groupIndex].keyId = this.generateShortKeyId();
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
   * Generate unique short key ID (8 characters)
   */
  generateKeyId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate unique contact ID
   */
  generateContactId() {
    return 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
   * Validate contact name
   */
  validateContactName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Contact name cannot be empty' };
    }
    
    if (name.length > 100) {
      return { valid: false, error: 'Contact name too long (max 100 characters)' };
    }
    
    return { valid: true };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialKeyManager;
} else {
  window.AsocialKeyManager = AsocialKeyManager;
}
