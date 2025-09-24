/**
 * Asocial Crypto Utilities - Simplified Version
 * Basic RSA encryption for Chrome extensions
 */

class AsocialCrypto {
  constructor() {
    this.algorithm = {
      name: 'RSA-OAEP',
      modulusLength: 1024,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-1'
    };
    
    this.symmetricAlgorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  /**
   * Generate RSA-1024 key pair (simplified for compatibility)
   */
  async generateKeyPair() {
    try {
      console.log('Starting RSA-1024 key generation...');
      
      if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
        throw new Error('WebCrypto API not available');
      }
      
      const keyPair = await crypto.subtle.generateKey(
        this.algorithm,
        true, // extractable
        ['encrypt', 'decrypt', 'sign', 'verify']
      );
      
      console.log('RSA-1024 key pair generated successfully');
      return keyPair;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error(`Failed to generate RSA key pair: ${error.message}`);
    }
  }

  /**
   * Generate random AES-256 key for symmetric encryption
   */
  async generateSymmetricKey() {
    try {
      const key = await crypto.subtle.generateKey(
        this.symmetricAlgorithm,
        true,
        ['encrypt', 'decrypt']
      );
      
      return key;
    } catch (error) {
      console.error('Symmetric key generation failed:', error);
      throw new Error('Failed to generate symmetric key');
    }
  }

  /**
   * Encrypt data with RSA public key
   */
  async encryptRSA(publicKey, data) {
    try {
      const encrypted = await crypto.subtle.encrypt(
        this.algorithm,
        publicKey,
        data
      );
      return encrypted;
    } catch (error) {
      console.error('RSA encryption failed:', error);
      throw new Error('Failed to encrypt with RSA');
    }
  }

  /**
   * Decrypt data with RSA private key
   */
  async decryptRSA(privateKey, encryptedData) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        this.algorithm,
        privateKey,
        encryptedData
      );
      return decrypted;
    } catch (error) {
      console.error('RSA decryption failed:', error);
      throw new Error('Failed to decrypt with RSA');
    }
  }

  /**
   * Encrypt data with AES-GCM
   */
  async encryptAES(key, data, iv) {
    try {
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );
      return encrypted;
    } catch (error) {
      console.error('AES encryption failed:', error);
      throw new Error('Failed to encrypt with AES');
    }
  }

  /**
   * Decrypt data with AES-GCM
   */
  async decryptAES(key, encryptedData, iv) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      );
      return decrypted;
    } catch (error) {
      console.error('AES decryption failed:', error);
      throw new Error('Failed to decrypt with AES');
    }
  }

  /**
   * Export key to base64 string
   */
  async exportKey(key, format = 'pkcs8') {
    try {
      const exported = await crypto.subtle.exportKey(format, key);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
      return base64;
    } catch (error) {
      console.error('Key export failed:', error);
      throw new Error('Failed to export key');
    }
  }

  /**
   * Import key from base64 string
   */
  async importKey(keyData, format, keyUsage, keyType = 'RSA') {
    try {
      console.log('Starting key import...');
      console.log('Parameters:', { format, keyType, keyUsage, keyDataLength: keyData.length });
      
      const binaryString = atob(keyData);
      const keyArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyArray[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Key array length:', keyArray.length);
      console.log('First 10 bytes:', Array.from(keyArray.slice(0, 10)));
      
      // Choose the right algorithm based on key type
      let algorithm;
      if (keyType === 'RSA') {
        algorithm = this.algorithm;
      } else if (keyType === 'AES') {
        algorithm = this.symmetricAlgorithm;
      } else {
        algorithm = this.algorithm; // Default to RSA
      }
      
      console.log('Using algorithm:', algorithm);
      console.log('Key usage:', keyUsage);
      
      const key = await crypto.subtle.importKey(
        format,
        keyArray,
        algorithm,
        false,
        keyUsage
      );
      
      console.log('Key imported successfully');
      return key;
    } catch (error) {
      console.error('Key import failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Import details:', { format, keyType, keyUsage, keyDataLength: keyData.length });
      throw new Error(`Failed to import key: ${error.message}`);
    }
  }

  /**
   * Generate random IV for AES
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Hash data with SHA-256
   */
  async hash(data) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Encrypt message with AES-GCM (for encryptionEngine compatibility)
   */
  async encryptMessage(message, symmetricKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const iv = this.generateIV();
      const encryptedData = await this.encryptAES(symmetricKey, messageData, iv);
      return { encryptedData, iv };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message with AES-GCM (for encryptionEngine compatibility)
   */
  async decryptMessage(encryptedData, symmetricKey, iv) {
    try {
      const decryptedData = await this.decryptAES(symmetricKey, encryptedData, iv);
      const message = new TextDecoder().decode(decryptedData);
      return { message };
    } catch (error) {
      console.error('Message decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt symmetric key with RSA (for encryptionEngine compatibility)
   */
  async encryptSymmetricKey(symmetricKey, publicKey) {
    try {
      const exportedKey = await crypto.subtle.exportKey('raw', symmetricKey);
      const encryptedKey = await this.encryptRSA(publicKey, exportedKey);
      return encryptedKey;
    } catch (error) {
      console.error('Symmetric key encryption failed:', error);
      throw new Error('Failed to encrypt symmetric key');
    }
  }

  /**
   * Decrypt symmetric key with RSA (for encryptionEngine compatibility)
   */
  async decryptSymmetricKey(encryptedSymmetricKey, privateKey) {
    try {
      const decryptedKey = await this.decryptRSA(privateKey, encryptedSymmetricKey);
      const symmetricKey = await crypto.subtle.importKey(
        'raw',
        decryptedKey,
        this.symmetricAlgorithm,
        false,
        ['encrypt', 'decrypt']
      );
      return symmetricKey;
    } catch (error) {
      console.error('Symmetric key decryption failed:', error);
      throw new Error('Failed to decrypt symmetric key');
    }
  }

  /**
   * Sign message with RSA (for encryptionEngine compatibility)
   */
  async signMessage(message, privateKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        privateKey,
        messageData
      );
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify message signature (for encryptionEngine compatibility)
   */
  async verifySignature(message, signature, publicKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const isValid = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        publicKey,
        signature,
        messageData
      );
      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}
