# Asocial - Encrypted Social Posts

A Chrome extension that enables encrypted messaging on social media platforms using high security encryption (RSA-2048, AES-256-GCM) with group-based access control.

## Features

- **High Security Encryption**: RSA-2048 and AES-256-GCM for strong security
- **Group-Based Access Control**: Create encryption groups (Family, Work, Close Friends)
- **Single Shared Key System**: One public key per group - simple and practical
- **LinkedIn Integration**: "Be Asocial" button for easy encryption
- **Automatic Decryption**: Messages are automatically decrypted for authorized users
- **Secure Key Sharing**: Export/import keys with "magic" key IDs for proper decryption
- **Content Security**: No encrypted data exposure in share URLs
- **Toggle Functionality**: "Show Encrypted" button to view original encrypted content
- **Key Management**: Secure key storage with master passphrase protection
- **Cross-Platform Support**: LinkedIn, Facebook, Twitter (LinkedIn implemented first)

## Installation

### Quick Install (Recommended)
1. Download the latest release: `asocial-extension-v2.4.zip`
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

### Creating Encryption Groups

1. Click the Asocial extension icon
2. Click "Create New Group"
3. Enter a group name (e.g., "Family", "Work", "Close Friends")
4. The extension will generate one RSA-2048 key pair for the group

### Sharing Keys

1. In the extension popup, select a group
2. Click "Export Public Key"
3. Share the **same public key** with all contacts in the group via:
   - Export key (includes "magic" key ID for proper decryption)
   - Copy/paste JSON format
   - QR code (future feature)
   - File export (future feature)

### Encrypting Posts

1. Write your post normally on LinkedIn
2. Click the "🔒 Be Asocial" button that appears
3. Select which group to encrypt for
4. Your post will be encrypted and published

### Decrypting Posts

- Posts are automatically decrypted if you have the correct key
- Users without the key see encrypted content with visual indicators
- Click "Show Encrypted" to view the original encrypted content
- Click "Hide Encrypted" to return to decrypted view

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
