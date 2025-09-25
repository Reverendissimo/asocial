/**
 * Asocial Message Encryption/Decryption
 * Handles message encryption with writer keys and decryption with reader keys
 */

class AsocialMessageCrypto {
  constructor() {
    this.crypto = new AsocialCrypto();
  }

  /**
   * Encrypt message with writer key
   * @param {string} message - Message to encrypt
   * @param {Object} writerKey - Writer key data
   * @returns {Promise<Object>} Encrypted message with magic code
   */
  async encryptMessage(message, writerKey) {
    try {
      console.log('AsocialMessageCrypto: Encrypting message with writer key:', writerKey.name);
      
      // Import writer key
      const publicKey = await this.crypto.importKey(writerKey.publicKey, 'spki', 'public');
      
      // Create message data
      const messageData = {
        message: message,
        timestamp: new Date().toISOString(),
        writerKeyId: writerKey.id
      };
      
      // Convert to JSON and encrypt
      const messageJson = JSON.stringify(messageData);
      const messageBuffer = new TextEncoder().encode(messageJson);
      
      // Encrypt with ECDSA (using public key for encryption)
      const encryptedData = await this.crypto.encryptData(messageJson, publicKey);
      
      // Generate magic code for tagging
      const magicCode = await this.generateMessageMagicCode(writerKey.id);
      
      // Create encrypted message format
      const encryptedMessage = `[ASOCIAL ${magicCode}] ${this.crypto.arrayBufferToBase64(encryptedData.data)}`;
      
      console.log('AsocialMessageCrypto: Message encrypted successfully');
      return {
        success: true,
        encryptedMessage: encryptedMessage,
        magicCode: magicCode
      };
    } catch (error) {
      console.error('AsocialMessageCrypto: Error encrypting message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decrypt message with reader key
   * @param {string} encryptedMessage - Encrypted message
   * @param {Object} readerKey - Reader key data
   * @returns {Promise<Object>} Decrypted message
   */
  async decryptMessage(encryptedMessage, readerKey) {
    try {
      console.log('AsocialMessageCrypto: Decrypting message with reader key:', readerKey.name);
      
      // Extract magic code and encrypted data
      const match = encryptedMessage.match(/\[ASOCIAL\s+([A-Z0-9]{7})\]\s*(.+)/);
      if (!match) {
        throw new Error('Invalid encrypted message format');
      }

      const magicCode = match[1];
      const encryptedData = match[2];
      
      // Verify magic code matches reader key
      if (magicCode !== readerKey.magicCode) {
        throw new Error('Magic code does not match reader key');
      }
      
      // Import reader key
      const privateKey = await this.crypto.importKey(readerKey.privateKey, 'pkcs8', 'private');
      
      // Decode encrypted data
      const encryptedBuffer = this.crypto.base64ToArrayBuffer(encryptedData);
      
      // Decrypt message
      const decryptedJson = await this.crypto.decryptData(
        {
          data: new Uint8Array(encryptedBuffer),
          iv: new Uint8Array(12), // Default IV for now
          tag: new Uint8Array(16) // Default tag for now
        },
        privateKey
      );
      
      // Parse decrypted data
      const messageData = JSON.parse(decryptedJson);
      
      console.log('AsocialMessageCrypto: Message decrypted successfully');
      return {
        success: true,
        message: messageData.message,
        timestamp: messageData.timestamp,
        writerKeyId: messageData.writerKeyId
      };
    } catch (error) {
      console.error('AsocialMessageCrypto: Error decrypting message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate magic code for message tagging
   * @param {string} writerKeyId - Writer key ID
   * @returns {Promise<string>} 7-character Base36 magic code
   */
  async generateMessageMagicCode(writerKeyId) {
    try {
      // Create hash from writer key ID
      const keyBuffer = new TextEncoder().encode(writerKeyId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
      
      // Convert hash to number and generate Base36 code
      const hashArray = new Uint8Array(hashBuffer);
      const hashNumber = this.crypto.bytesToNumber(hashArray);
      
      // Generate 7-character Base36 code
      const magicCode = this.crypto.numberToBase36(hashNumber, 7);
      
      return magicCode;
    } catch (error) {
      console.error('AsocialMessageCrypto: Error generating magic code:', error);
      // Fallback to random code
      return this.crypto.numberToBase36(Math.floor(Math.random() * 78364164096), 7);
    }
  }

  /**
   * Find reader key by magic code
   * @param {string} magicCode - Magic code to search for
   * @param {Array} readerKeys - Array of reader keys
   * @returns {Object|null} Matching reader key or null
   */
  findReaderKeyByMagicCode(magicCode, readerKeys) {
    try {
      console.log('AsocialMessageCrypto: Finding reader key by magic code:', magicCode);
      
      const readerKey = readerKeys.find(key => key.magicCode === magicCode);
      
      if (readerKey) {
        console.log('AsocialMessageCrypto: Reader key found:', readerKey.name);
        return readerKey;
      } else {
        console.log('AsocialMessageCrypto: No reader key found for magic code');
        return null;
      }
    } catch (error) {
      console.error('AsocialMessageCrypto: Error finding reader key:', error);
      return null;
    }
  }

  /**
   * Validate encrypted message format
   * @param {string} message - Message to validate
   * @returns {boolean} True if valid encrypted message format
   */
  validateEncryptedMessage(message) {
    const pattern = /^\[ASOCIAL\s+[A-Z0-9]{7}\]\s*.+$/;
    return pattern.test(message);
  }

  /**
   * Extract magic code from encrypted message
   * @param {string} encryptedMessage - Encrypted message
   * @returns {string|null} Magic code or null if not found
   */
  extractMagicCode(encryptedMessage) {
    const match = encryptedMessage.match(/\[ASOCIAL\s+([A-Z0-9]{7})\]/);
    return match ? match[1] : null;
  }

  /**
   * Create encrypted message display format
   * @param {string} encryptedMessage - Encrypted message
   * @returns {string} Formatted display text
   */
  formatEncryptedMessageDisplay(encryptedMessage) {
    const magicCode = this.extractMagicCode(encryptedMessage);
    if (magicCode) {
      return `[ASOCIAL ENCRYPTED] ${magicCode}`;
    }
    return '[ASOCIAL ENCRYPTED]';
  }

  /**
   * Create decrypted message display format
   * @param {string} message - Decrypted message
   * @returns {string} Formatted display text
   */
  formatDecryptedMessageDisplay(message) {
    return `[ASOCIAL] ${message}`;
  }

  /**
   * Check if message is encrypted
   * @param {string} message - Message to check
   * @returns {boolean} True if message is encrypted
   */
  isEncryptedMessage(message) {
    return this.validateEncryptedMessage(message);
  }

  /**
   * Get message encryption info
   * @param {string} encryptedMessage - Encrypted message
   * @returns {Object} Encryption info
   */
  getMessageInfo(encryptedMessage) {
    const magicCode = this.extractMagicCode(encryptedMessage);
    return {
      isEncrypted: this.isEncryptedMessage(encryptedMessage),
      magicCode: magicCode,
      displayText: this.formatEncryptedMessageDisplay(encryptedMessage)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialMessageCrypto;
} else if (typeof window !== 'undefined') {
  window.AsocialMessageCrypto = AsocialMessageCrypto;
} else if (typeof self !== 'undefined') {
  self.AsocialMessageCrypto = AsocialMessageCrypto;
}
