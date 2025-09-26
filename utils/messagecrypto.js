/**
 * Asocial Message Encryption/Decryption
 * Handles message encryption with writer keys and decryption with reader keys
 */

class AsocialMessageCrypto {
  constructor() {
    this.crypto = new AsocialCrypto();
  }

  /**
   * Encrypt message with writer key using ECIES
   * @param {string} message - Message to encrypt
   * @param {Object} writerKey - Writer key data
   * @returns {Promise<Object>} Encrypted message with magic code
   */
  async encryptMessage(message, writerKey) {
    try {
      console.log('AsocialMessageCrypto: Encrypting message with writer key:', writerKey.name);
      
      // Import writer key - validate base64 first
      if (!writerKey.publicKey || typeof writerKey.publicKey !== 'string') {
        throw new Error('Invalid public key data: not a string');
      }
      
      // Check if it's valid base64
      try {
        atob(writerKey.publicKey);
      } catch (error) {
        throw new Error('Invalid public key data: not valid base64');
      }
      
      // Import the writer's public key for ECDH operations
      const publicKey = await crypto.subtle.importKey(
        'spki',
        this.crypto.base64ToArrayBuffer(writerKey.publicKey),
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        [] // ECDH public keys don't need specific usages for deriveBits
      );
      
      // Create message data
      const messageData = {
        message: message,
        timestamp: new Date().toISOString(),
        writerKeyId: writerKey.id
      };
      
      // Convert to JSON
      const messageJson = JSON.stringify(messageData);
      const messageBuffer = new TextEncoder().encode(messageJson);
      
      // Generate ephemeral key pair for ECIES
      const ephemeralKeyPair = await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ['deriveBits'] // ECIES needs deriveBits, not deriveKey
      );
      
      // Derive shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: publicKey
        },
        ephemeralKeyPair.privateKey,
        256 // 256 bits for AES-256
      );
      
      // Import the derived bits as an AES key
      const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        {
          name: "AES-GCM",
          length: 256
        },
        false,
        ['encrypt']
      );
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt message with AES-GCM
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        aesKey,
        messageBuffer
      );
      
      // Export ephemeral public key
      const ephemeralPublicKey = await crypto.subtle.exportKey('spki', ephemeralKeyPair.publicKey);
      const ephemeralPublicKeyBase64 = this.crypto.arrayBufferToBase64(ephemeralPublicKey);
      
      // Create ECIES payload
      const eciesPayload = {
        ephemeralPublicKey: ephemeralPublicKeyBase64,
        iv: this.crypto.arrayBufferToBase64(iv),
        encryptedData: this.crypto.arrayBufferToBase64(encryptedData)
      };
      
      // Use the magic code from the writer key (should match the reader key magic code)
      const magicCode = writerKey.magicCode;
      console.log('AsocialMessageCrypto: Using magic code from writer key:', magicCode);
      
      // Encode entire payload as base64
      const payloadJson = JSON.stringify(eciesPayload);
      const payloadBase64 = this.crypto.arrayBufferToBase64(new TextEncoder().encode(payloadJson));
      
      // Create encrypted message format
      const encryptedMessage = `[ASOCIAL ${magicCode}] ${payloadBase64}`;
      
      console.log('AsocialMessageCrypto: Message encrypted successfully with ECIES');
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
   * Decrypt message with reader key using ECIES
   * @param {string} magicCode - Magic code
   * @param {string} encryptedPayload - Base64 encrypted payload
   * @param {Object} readerKey - Reader key data
   * @returns {Promise<Object>} Decrypted message
   */
  async decryptMessage(magicCode, encryptedPayload, readerKey) {
    try {
      console.log('AsocialMessageCrypto: Decrypting message with reader key:', readerKey.name);
      console.log('AsocialMessageCrypto: Magic code:', magicCode);
      console.log('AsocialMessageCrypto: Encrypted payload length:', encryptedPayload.length);
      
      // Verify magic code matches reader key
      if (magicCode !== readerKey.magicCode) {
        throw new Error('Magic code does not match reader key');
      }
      
      // Trim whitespace from Base64 payload
      const trimmedPayload = encryptedPayload.trim();
      console.log('AsocialMessageCrypto: Original payload length:', encryptedPayload.length);
      console.log('AsocialMessageCrypto: Trimmed payload length:', trimmedPayload.length);
      console.log('AsocialMessageCrypto: Full Base64 payload enclosed in brackets:');
      console.log('[' + trimmedPayload + ']');
      console.log('AsocialMessageCrypto: Base64 payload (first 100 chars):', trimmedPayload.substring(0, 100));
      console.log('AsocialMessageCrypto: Base64 payload (last 100 chars):', trimmedPayload.substring(trimmedPayload.length - 100));
      
      // Decode base64 payload
      const payloadBytes = this.crypto.base64ToArrayBuffer(trimmedPayload);
      const payloadJson = new TextDecoder().decode(payloadBytes);
      
      // Parse ECIES payload
      const eciesPayload = JSON.parse(payloadJson);
      
      // Debug: Check reader key data
      console.log('AsocialMessageCrypto: Reader key data:', {
        id: readerKey.id,
        name: readerKey.name,
        hasPrivateKey: !!readerKey.privateKey,
        privateKeyLength: readerKey.privateKey ? readerKey.privateKey.length : 'undefined'
      });
      
      if (!readerKey.privateKey) {
        throw new Error('Reader key does not have a private key');
      }
      
      // Import reader key for ECDH operations
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        this.crypto.base64ToArrayBuffer(readerKey.privateKey),
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ['deriveBits'] // ECDH private keys need deriveBits for ECIES
      );
      
      // Import ephemeral public key for ECDH operations
      const ephemeralPublicKey = await crypto.subtle.importKey(
        'spki',
        this.crypto.base64ToArrayBuffer(eciesPayload.ephemeralPublicKey),
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        [] // ECDH public keys don't need specific usages for deriveBits
      );
      
      // Derive shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: ephemeralPublicKey
        },
        privateKey,
        256 // 256 bits for AES-256
      );
      
      // Import the derived bits as an AES key
      const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        {
          name: "AES-GCM",
          length: 256
        },
        false,
        ['decrypt']
      );
      
      // Decode IV and encrypted data
      const iv = this.crypto.base64ToArrayBuffer(eciesPayload.iv);
      const encryptedData = this.crypto.base64ToArrayBuffer(eciesPayload.encryptedData);
      
      // Decrypt message with AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        aesKey,
        encryptedData
      );
      
      // Parse decrypted data
      const decryptedJson = new TextDecoder().decode(decryptedBuffer);
      const messageData = JSON.parse(decryptedJson);
      
      console.log('AsocialMessageCrypto: Message decrypted successfully with ECIES');
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
