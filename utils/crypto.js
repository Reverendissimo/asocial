/**
 * Asocial Cryptographic Utilities
 * WebCrypto API implementation for ECDSA-256, PBKDF2, AES-256-GCM
 */

class AsocialCrypto {
  constructor() {
    this.algorithm = {
      // ECDSA-256 for key pairs and message encryption/decryption
      ecdsa: {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      
      // PBKDF2 for key derivation from passwords
      pbkdf2: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 100000 // 100k iterations for security
      },
      
      // AES-256-GCM for symmetric encryption
      aes: {
        name: 'AES-GCM',
        length: 256
      }
    };
  }

  /**
   * Generate ECDSA-256 key pair
   * @param {string} keyName - Name for the key
   * @returns {Promise<Object>} Key pair with public/private keys
   */
  async generateKeyPair(keyName) {
    try {
      console.log('AsocialCrypto: Generating ECIES-256 key pair for:', keyName);
      
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true, // extractable
        ['deriveKey'] // ECIES uses key derivation
      );

      // Export keys to Base64
      const publicKey = await this.exportKey(keyPair.publicKey);
      const privateKey = await this.exportKey(keyPair.privateKey);

      const keyData = {
        id: this.generateKeyId(),
        name: keyName,
        type: 'ecdsa',
        publicKey: publicKey,
        privateKey: privateKey,
        createdAt: new Date().toISOString()
      };

      console.log('AsocialCrypto: Key pair generated successfully');
      return keyData;
    } catch (error) {
      console.error('AsocialCrypto: Error generating key pair:', error);
      throw new Error('Failed to generate key pair: ' + error.message);
    }
  }

  /**
   * Derive key from password using PBKDF2
   * @param {string} password - Password to derive key from
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived key
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      console.log('AsocialCrypto: Deriving key from password');
      
      const passwordBuffer = new TextEncoder().encode(password);
      
      const key = await crypto.subtle.deriveKey(
        {
          name: this.algorithm.pbkdf2.name,
          hash: this.algorithm.pbkdf2.hash,
          salt: salt,
          iterations: this.algorithm.pbkdf2.iterations
        },
        await crypto.subtle.importKey(
          'raw',
          passwordBuffer,
          'PBKDF2',
          false,
          ['deriveKey']
        ),
        {
          name: this.algorithm.aes.name,
          length: this.algorithm.aes.length
        },
        false,
        ['encrypt', 'decrypt']
      );

      console.log('AsocialCrypto: Key derived successfully');
      return key;
    } catch (error) {
      console.error('AsocialCrypto: Error deriving key from password:', error);
      throw new Error('Failed to derive key from password: ' + error.message);
    }
  }

  /**
   * Generate random salt for PBKDF2
   * @returns {Uint8Array} Random salt
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} data - Data to encrypt
   * @param {CryptoKey} key - Encryption key
   * @returns {Promise<Object>} Encrypted data with IV and tag
   */
  async encryptData(data, key) {
    try {
      console.log('AsocialCrypto: Encrypting data with AES-256-GCM');
      
      const dataBuffer = new TextEncoder().encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm.aes.name,
          iv: iv
        },
        key,
        dataBuffer
      );

      const result = {
        data: new Uint8Array(encryptedData),
        iv: iv
      };

      console.log('AsocialCrypto: Data encrypted successfully');
      return result;
    } catch (error) {
      console.error('AsocialCrypto: Error encrypting data:', error);
      throw new Error('Failed to encrypt data: ' + error.message);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data with IV and tag
   * @param {CryptoKey} key - Decryption key
   * @returns {Promise<string>} Decrypted data
   */
  async decryptData(encryptedData, key) {
    try {
      console.log('AsocialCrypto: Decrypting data with AES-256-GCM');
      console.log('AsocialCrypto: Data length:', encryptedData.data.length, 'IV length:', encryptedData.iv.length);
      
      // For GCM, the encrypted data already includes the tag
      // We don't need to combine anything
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm.aes.name,
          iv: encryptedData.iv
        },
        key,
        encryptedData.data
      );

      const result = new TextDecoder().decode(decryptedData);
      console.log('AsocialCrypto: Data decrypted successfully');
      return result;
    } catch (error) {
      console.error('AsocialCrypto: Error decrypting data:', error);
      console.error('AsocialCrypto: This usually means the password is wrong or the data is corrupted');
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }

  /**
   * Export key to Base64 string
   * @param {CryptoKey} key - Key to export
   * @returns {Promise<string>} Base64 encoded key
   */
  async exportKey(key) {
    try {
      // Check key type to determine format
      const keyType = key.type;
      
      if (keyType === 'public') {
        // Export public key as spki
        const exported = await crypto.subtle.exportKey('spki', key);
        const base64 = this.arrayBufferToBase64(exported);
        return base64;
      } else if (keyType === 'private') {
        // Export private key as pkcs8
        const exported = await crypto.subtle.exportKey('pkcs8', key);
        const base64 = this.arrayBufferToBase64(exported);
        return base64;
      } else {
        throw new Error('Unknown key type: ' + keyType);
      }
    } catch (error) {
      console.error('AsocialCrypto: Error exporting key:', error);
      throw new Error('Failed to export key: ' + error.message);
    }
  }

  /**
   * Export private key to Base64 string
   * @param {CryptoKey} privateKey - Private key to export
   * @returns {Promise<string>} Base64 encoded private key
   */
  async exportPrivateKey(privateKey) {
    try {
      const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('AsocialCrypto: Error exporting private key:', error);
      throw new Error('Failed to export private key: ' + error.message);
    }
  }

  /**
   * Import key from Base64 string
   * @param {string} keyData - Base64 encoded key
   * @param {string} format - Key format ('pkcs8' or 'spki')
   * @param {string} type - Key type ('private' or 'public')
   * @returns {Promise<CryptoKey>} Imported key
   */
  async importKey(keyData, format, type) {
    try {
      
      // Validate input
      if (!keyData || typeof keyData !== 'string') {
        throw new Error('Key data must be a string');
      }
      
      if (keyData.length === 0) {
        throw new Error('Key data is empty');
      }
      
      // Validate base64 format
      try {
        atob(keyData);
      } catch (error) {
        throw new Error('Key data is not valid base64: ' + error.message);
      }
      
      const keyBuffer = this.base64ToArrayBuffer(keyData);
      
      const key = await crypto.subtle.importKey(
        format,
        keyBuffer,
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        type === 'private' ? ['deriveKey'] : ['deriveKey']
      );

      return key;
    } catch (error) {
      console.error('AsocialCrypto: Error importing key:', error);
      throw new Error('Failed to import key: ' + error.message);
    }
  }

  /**
   * Sign data with private key
   * @param {string} data - Data to sign
   * @param {CryptoKey} privateKey - Private key for signing
   * @returns {Promise<string>} Base64 encoded signature
   */
  async signData(data, privateKey) {
    try {
      console.log('AsocialCrypto: Signing data with ECDSA');
      
      const dataBuffer = new TextEncoder().encode(data);
      const signature = await crypto.subtle.sign(
        {
          name: this.algorithm.ecdsa.name,
          hash: 'SHA-256'
        },
        privateKey,
        dataBuffer
      );

      const signatureBase64 = this.arrayBufferToBase64(signature);
      console.log('AsocialCrypto: Data signed successfully');
      return signatureBase64;
    } catch (error) {
      console.error('AsocialCrypto: Error signing data:', error);
      throw new Error('Failed to sign data: ' + error.message);
    }
  }

  /**
   * Verify signature with public key
   * @param {string} data - Original data
   * @param {string} signature - Base64 encoded signature
   * @param {CryptoKey} publicKey - Public key for verification
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verifySignature(data, signature, publicKey) {
    try {
      console.log('AsocialCrypto: Verifying signature with ECDSA');
      
      const dataBuffer = new TextEncoder().encode(data);
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      
      const isValid = await crypto.subtle.verify(
        {
          name: this.algorithm.ecdsa.name,
          hash: 'SHA-256'
        },
        publicKey,
        signatureBuffer,
        dataBuffer
      );

      console.log('AsocialCrypto: Signature verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('AsocialCrypto: Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Generate magic code from reader key
   * @param {string} privateKey - Base64 encoded private key
   * @returns {Promise<string>} 7-character Base36 magic code
   */
  async generateMagicCode(privateKey) {
    try {
      console.log('AsocialCrypto: Generating magic code from reader key');
      
      // Create hash from private key
      const keyBuffer = this.base64ToArrayBuffer(privateKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
      
      // Convert hash to number and generate Base36 code
      const hashArray = new Uint8Array(hashBuffer);
      const hashNumber = this.bytesToNumber(hashArray);
      
      // Generate 7-character Base36 code (78.3 billion combinations)
      const magicCode = this.numberToBase36(hashNumber, 7);
      
      console.log('AsocialCrypto: Magic code generated:', magicCode);
      return magicCode;
    } catch (error) {
      console.error('AsocialCrypto: Error generating magic code:', error);
      throw new Error('Failed to generate magic code: ' + error.message);
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   * @param {ArrayBuffer} buffer - ArrayBuffer to convert
   * @returns {string} Base64 encoded string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   * @param {string} base64 - Base64 encoded string
   * @returns {ArrayBuffer} ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    console.log('AsocialCrypto: base64ToArrayBuffer called with length:', base64.length);
    console.log('AsocialCrypto: Base64 string (first 50 chars):', base64.substring(0, 50));
    console.log('AsocialCrypto: Base64 string (last 50 chars):', base64.substring(base64.length - 50));
    
    try {
      const binary = atob(base64);
      console.log('AsocialCrypto: atob successful, binary length:', binary.length);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('AsocialCrypto: atob failed with error:', error.message);
      console.log('AsocialCrypto: Full Base64 string that failed:', base64);
      throw error;
    }
  }

  /**
   * Convert bytes to number
   * @param {Uint8Array} bytes - Byte array
   * @returns {number} Number representation
   */
  bytesToNumber(bytes) {
    let result = 0;
    for (let i = 0; i < bytes.length; i++) {
      result = (result * 256) + bytes[i];
    }
    return result;
  }

  /**
   * Convert number to Base36
   * @param {number} number - Number to convert
   * @param {number} length - Desired length of result
   * @returns {string} Base36 encoded string
   */
  numberToBase36(number, length) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    while (number > 0) {
      result = chars[number % 36] + result;
      number = Math.floor(number / 36);
    }
    
    // Pad with zeros to desired length
    while (result.length < length) {
      result = '0' + result;
    }
    
    // Truncate if too long
    if (result.length > length) {
      result = result.slice(-length);
    }
    
    return result;
  }

  /**
   * Generate unique key ID
   * @returns {string} Unique key ID
   */
  generateKeyId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `key_${timestamp}_${random}`;
  }

  /**
   * Generate random bytes
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} Random bytes
   */
  generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Base64 encoded hash
   */
  async hashData(data) {
    try {
      const dataBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error('AsocialCrypto: Error hashing data:', error);
      throw new Error('Failed to hash data: ' + error.message);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialCrypto;
} else if (typeof window !== 'undefined') {
  window.AsocialCrypto = AsocialCrypto;
} else if (typeof self !== 'undefined') {
  self.AsocialCrypto = AsocialCrypto;
}
