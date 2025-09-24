# Asocial - Cypher Squatting Tool v2.8

A Chrome extension that enables encrypted messaging on ANY website using high security encryption (RSA-2048, AES-256-GCM) with encrypted local storage and multi-user support. **Latest update: Universal clipboard approach with automatic text selection and pasting.**

## Features

- **High Security Encryption**: RSA-2048 and AES-256-GCM for maximum security
- **Encrypted Local Storage**: All keys stored in password-protected `.ASoc` files
- **Multi-User Support**: Separate encrypted vaults for different users
- **Session Authentication**: Password required each time you open the extension
- **Writer Key System**: Create writer keys (Family, Work, Close Friends) for encrypting your messages
- **Reader Key System**: Import reader keys from others to decrypt their messages
- **Universal Contextual Menu**: Right-click any selected text → "Encrypt with Asocial"
- **Cross-Platform Support**: Works on LinkedIn, Facebook, Twitter, Gmail, Reddit, Discord, Slack, and ANY website
- **Keyboard Shortcut**: Ctrl+Shift+E to automatically select all text and encrypt
- **Automatic Text Selection**: Ctrl+Shift+E automatically selects all text in current input field
- **Automatic Pasting**: Encrypted text is automatically pasted after encryption
- **Automatic Decryption**: Messages are automatically decrypted for authorized users
- **Simple Text Display**: Decrypted messages show as `[ASOCIAL] decrypted text`
- **Secure Key Sharing**: Export/import keys with "magic" key IDs for proper decryption
- **No DOM Breaking**: Simple text replacement that doesn't break websites

## Installation

### Quick Install (Recommended)
1. Download the latest release: `asocial_v2.8_final.zip`
2. Extract the zip file
3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extracted folder

### Development Install
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

## Usage

### First Time Setup (Encrypted Storage)

1. **Set Key Storage Name**: Enter your key storage name (cannot be changed)
2. **Set Password**: Create a strong password for your encrypted storage
3. **Storage Created**: Your encrypted `.ASoc` storage file is created
4. **Session Authentication**: Password required each time you open the extension

### Creating Writer Keys

1. Click the Asocial extension icon
2. Click "Create New Writer Key"
3. Enter a writer key name (e.g., "Family", "Work", "Close Friends")
4. The extension will generate one RSA-4096 writer key pair for the group

### Sharing Writer Keys

1. In the extension popup, select a group
2. Click "Export Writer Key"
3. Share the **same writer key** with all people in the group via:
   - Export key (includes "magic" key ID for proper decryption)
   - Copy/paste JSON format
   - QR code (future feature)
   - File export (future feature)

### Encrypting Messages

**Method 1: Keyboard Shortcut (Recommended)**
1. **Click in any text input field** (LinkedIn, Facebook, Twitter, Gmail, Reddit, Discord, etc.)
2. **Press Ctrl+Shift+E** - automatically selects all text and shows encryption modal
3. **Choose writer key** from the modal
4. **Text is encrypted and pasted automatically**

**Method 2: Right-Click Menu**
1. **Select any text** in any input field
2. **Right-click** → "Encrypt with Asocial"
3. **Choose writer key** from the modal
4. **Text is encrypted and pasted automatically**

### Decrypting Messages

- **Decrypted messages** show as `[ASOCIAL] decrypted message text`
- **Encrypted messages** show as `[ASOCIAL ENCRYPTED] encrypted message text`
- **Automatic decryption** if you have the correct reader key
- **Simple text display** that doesn't break websites

## Security Features

- **RSA-2048 Encryption**: Strong RSA key strength for high security
- **AES-256-GCM**: Advanced symmetric encryption with authentication
- **Secure Key Sharing**: Keys include "magic" key IDs for proper decryption
- **URL Security**: No encrypted content exposure in share URLs
- **CSP Compliance**: Follows LinkedIn's Content Security Policy
- **Argon2id Key Derivation**: Secure key derivation from passphrases
- **SHA-512 Hashing**: Maximum hash security for signatures
- **Local Key Storage**: Keys never leave your device
- **End-to-End Encryption**: Only intended recipients can decrypt

## Architecture

- **Manifest V3**: Latest Chrome extension standard
- **WebCrypto API**: Browser-native cryptographic functions
- **Content Scripts**: Platform-specific integration
- **Background Service Worker**: Extension lifecycle management
- **Popup Interface**: Key management and settings

## Development

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Package for distribution
npm run package
```

## Supported Platforms

- ✅ **LinkedIn** (Fully implemented)
- 🚧 **Facebook** (Planned)
- 🚧 **Twitter** (Planned)

## Security Considerations

- All encryption is performed client-side
- Private keys are never transmitted
- Keys are encrypted with master passphrase
- No server-side key storage
- Open source for security auditing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.
