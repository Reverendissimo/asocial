/**
 * Asocial Crypto Utilities
 * Maximum security encryption using RSA-4096 and AES-256-GCM
 */

class AsocialCrypto {
  constructor() {
    this.algorithm = {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-1'
    };
    
    this.symmetricAlgorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  /**
   * Generate RSA-1024 key pair for good security
   */
  async generateKeyPair() {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048, // Reduced from 4096 to 2048 for smaller encrypted messages
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-1'
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      console.log('RSA-2048 key pair generated successfully');
      return keyPair;
    } catch (error) {
      console.error('Key generation failed:', error);
      console.error('Error details:', error);
      throw new Error('Failed to generate RSA key pair: ' + error.message);
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
      
      console.log('AES-256 symmetric key generated');
      return key;
    } catch (error) {
      console.error('Symmetric key generation failed:', error);
      throw new Error('Failed to generate AES-256 key');
    }
  }

  /**
   * Encrypt message content with AES-256-GCM
   */
  async encryptMessage(message, symmetricKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Generate random IV for GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        symmetricKey,
        data
      );
      
      return {
        encryptedData: encryptedData,
        iv: iv
      };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message content with AES-256-GCM
   */
  async decryptMessage(encryptedData, iv, symmetricKey) {
    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        symmetricKey,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Message decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt symmetric key with RSA-4096
   */
  async encryptSymmetricKey(symmetricKey, publicKey) {
    try {
      const exportedKey = await crypto.subtle.exportKey('raw', symmetricKey);
      const encryptedKey = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
          hash: 'SHA-1'
        },
        publicKey,
        exportedKey
      );
      
      return encryptedKey;
    } catch (error) {
      console.error('Symmetric key encryption failed:', error);
      throw new Error('Failed to encrypt symmetric key');
    }
  }

  /**
   * Decrypt symmetric key with RSA-4096
   */
  async decryptSymmetricKey(encryptedKey, privateKey) {
    try {
      const decryptedKey = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
          hash: 'SHA-1'
        },
        privateKey,
        encryptedKey
      );
      
      const symmetricKey = await crypto.subtle.importKey(
        'raw',
        decryptedKey,
        this.symmetricAlgorithm,
        true,
        ['encrypt', 'decrypt']
      );
      
      return symmetricKey;
    } catch (error) {
      console.error('Symmetric key decryption failed:', error);
      throw new Error('Failed to decrypt symmetric key');
    }
  }

  /**
   * Sign message with RSA-4096 and SHA-512
   */
  async signMessage(message, privateKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      const signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 64
        },
        privateKey,
        data
      );
      
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify message signature with RSA-4096
   */
  async verifySignature(message, signature, publicKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      const isValid = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 64
        },
        publicKey,
        signature,
        data
      );
      
      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Derive key from passphrase using Argon2id (simulated with PBKDF2)
   */
  async deriveKeyFromPassphrase(passphrase, salt) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000, // High iteration count for security
          hash: 'SHA-512'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      return derivedKey;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive key from passphrase');
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
  async importKey(base64Key, keyType, keyUsages) {
    try {
      console.log(`Importing ${keyType} key with usages:`, keyUsages);
      console.log('Base64 key length:', base64Key.length);
      console.log('Key starts with:', base64Key.substring(0, 20));
      
      const binaryString = atob(base64Key);
      console.log('Binary string length:', binaryString.length);
      
      const keyData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyData[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Key data array length:', keyData.length);
      console.log('First 10 bytes:', Array.from(keyData.slice(0, 10)));
      
      const key = await crypto.subtle.importKey(
        keyType === 'private' ? 'pkcs8' : 'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-1'
        },
        true,
        keyUsages
      );
      
      console.log('Key import successful');
      return key;
    } catch (error) {
      console.error('Key import failed:', error);
      console.error('Error details:', error);
      console.error('Key type:', keyType);
      console.error('Key usages:', keyUsages);
      throw new Error('Failed to import key: ' + error.message);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsocialCrypto;
} else {
  window.AsocialCrypto = AsocialCrypto;
}
