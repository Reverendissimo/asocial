# 🔒 Asocial - Encrypted Social Posts

A Chrome extension that enables end-to-end encrypted messaging on ANY website using modern cryptography and a clean, maintainable architecture.

## ✨ Features

- **Universal Compatibility**: Works on any website with text inputs (LinkedIn, Facebook, Twitter, Gmail, Reddit, Discord, Slack, etc.)
- **End-to-End Encryption**: ECDSA-256 encryption with PBKDF2 key derivation and AES-256-GCM
- **Multi-User Support**: Multiple KeyStores with separate encrypted storage
- **Automatic Workflow**: Ctrl+Shift+E to encrypt, automatic decryption on page load
- **Hackish Design**: Black and lime green aesthetic with minimal, functional interface
- **Key Management**: Create, import, export, and manage writer/reader keys
- **Magic Code System**: 7-character Base36 codes (78.3 billion combinations) for key identification
- **JSON Export/Import**: Complete key data export with name, private key, and magic code
- **Auto-Generated Reader Keys**: Writer keys automatically create corresponding reader keys

## 🚀 Quick Start

### Installation

1. **Load the Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

2. **Create Your First KeyStore**
   - Click the Asocial icon in your browser toolbar
   - Click "Create KeyStore"
   - Enter a name, description, and password
   - Click "Create KeyStore"

3. **Create Your Keys**
   - Create a writer key (for encrypting messages you send)
   - Add a reader key (for decrypting messages you receive)

### Usage

1. **Encrypt Messages**
   - Type your message in any text input
   - Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac)
   - Select your writer key
   - Message is encrypted and pasted automatically

2. **Decrypt Messages**
   - Encrypted messages are automatically decrypted on page load
   - Decrypted messages show with `[ASOCIAL]` prefix and green styling
   - Only messages you can decrypt (with matching reader keys) are shown

## 🔑 Key Exchange

### Sharing Your Writer Key

1. **Export Your Reader Key**
   - In the extension popup, find your writer key
   - Click "Copy Reader Key" button
   - This exports a complete JSON with name, private key, and magic code
   - Share this JSON with people you want to send encrypted messages to

2. **They Import Your Key**
   - They paste the JSON in their extension's "Add Reader Key" section
   - The system automatically extracts name, private key, and magic code
   - Now they can decrypt messages you send them

### Receiving Their Reader Key

1. **Get Their Reader Key**
   - Ask them to export their reader key (JSON format)
   - They should share the complete JSON with you

2. **Import Their Key**
   - In your extension, go to Reader Keys section
   - Click "+ Add Reader Key" and paste the JSON
   - The system automatically imports with proper name and magic code
   - Now you can decrypt messages they send you

## 🏗️ Architecture

### Core Components

- **Background Service Worker**: Key storage, encryption, and message handling
- **Universal Content Script**: Text detection, encryption/decryption, and DOM manipulation
- **Popup UI**: Single panel design with dynamic DOM manipulation
- **Crypto Utilities**: WebCrypto API implementation for ECDSA-256, PBKDF2, AES-256-GCM

### Key Features

- **KeyStore Management**: Multiple encrypted storage objects with password protection
- **Key Generation**: ECDSA-256 key pairs with magic code generation
- **Message Encryption**: Writer keys for encrypting messages you send
- **Message Decryption**: Reader keys for decrypting messages you receive
- **Automatic Workflow**: Keyboard shortcuts and automatic text selection/pasting

## 🔒 Security

### Encryption

- **ECDSA-256**: For message encryption/decryption
- **PBKDF2**: Key derivation from passwords (100k iterations)
- **AES-256-GCM**: Symmetric encryption for KeyStore and individual keys
- **Magic Codes**: Base36, 7-character codes for key identification

### Key Management

- **Worker-Only Access**: Keys are never exposed to the UI
- **Password Protection**: KeyStores are encrypted with user passwords
- **Secure Storage**: All keys are encrypted before storage
- **Memory Management**: Only active KeyStore is kept in memory

### Privacy

- **No Data Collection**: Extension doesn't collect or transmit any data
- **Local Storage**: All data is stored locally on your device
- **No Tracking**: No analytics or tracking of any kind
- **Open Source**: Full source code is available for review

## 📁 Project Structure

```
asocial/
├── manifest.json                 # Extension manifest
├── background/
│   └── background.js            # Service worker
├── content/
│   ├── universal.js            # Universal content script
│   └── universal.css           # Content script styles
├── popup/
│   ├── popup.html              # Popup UI
│   ├── popup.js                # Popup logic
│   └── popup.css               # Popup styles
├── utils/
│   ├── crypto.js               # Cryptographic utilities
│   ├── keystore.js             # KeyStore management
│   ├── keymanager.js           # Key management
│   └── messagecrypto.js        # Message encryption/decryption
├── icons/                      # Extension icons
├── test_extension.html         # Test page
├── ARCHITECTURE.md             # Detailed architecture
├── INSTALLATION_GUIDE.md       # Installation instructions
├── KEY_EXCHANGE_GUIDE.md       # Key exchange guide
└── README.md                   # This file
```

## 🧪 Testing

### Test Page

Open `test_extension.html` in your browser to test the extension functionality:

- Test encryption workflow
- Test decryption workflow
- Test keyboard shortcuts
- Test API functionality

### Manual Testing

1. **Create KeyStore**: Test KeyStore creation and authentication
2. **Create Keys**: Test writer and reader key creation
3. **Encrypt Messages**: Test message encryption with different keys
4. **Decrypt Messages**: Test automatic decryption on page load
5. **Key Exchange**: Test key import/export functionality

## 🔧 Development

### Prerequisites

- Chrome browser with extension development support
- Basic understanding of Chrome extension development
- Knowledge of JavaScript and WebCrypto API

### Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd asocial
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. **Start Development**
   - Make changes to the code
   - Reload the extension to see changes
   - Use the test page to verify functionality

### Building

The extension is ready to use as-is. For distribution:

1. **Test Thoroughly**: Use the test page and manual testing
2. **Package Extension**: Use Chrome's "Pack extension" feature
3. **Submit to Store**: Follow Chrome Web Store submission process

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed technical architecture
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)**: Step-by-step installation guide
- **[KEY_EXCHANGE_GUIDE.md](KEY_EXCHANGE_GUIDE.md)**: Key exchange and security guide
- **[TODO.md](TODO.md)**: Development task list and progress

## 🤝 Contributing

### Development Process

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your changes
4. **Test Thoroughly**: Use the test page and manual testing
5. **Submit Pull Request**: Create a pull request with your changes

### Code Standards

- **JavaScript**: Use modern ES6+ features
- **Comments**: Document complex functions and algorithms
- **Error Handling**: Implement proper error handling and user feedback
- **Security**: Follow security best practices for cryptographic operations

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Working**
   - Check if extension is enabled
   - Reload the extension and try again
   - Check browser console for errors

2. **Encryption Not Working**
   - Make sure you have writer keys available
   - Check keyboard shortcut (Ctrl+Shift+E)
   - Verify text is selected before pressing shortcut

3. **Decryption Not Working**
   - Make sure you have reader keys for the messages
   - Check if the message format is correct
   - Verify the sender's key is in your reader keys

### Getting Help

1. **Check Console**: Press F12 and look for error messages
2. **Test Page**: Use the included test page to isolate issues
3. **Documentation**: Check the guides for detailed instructions
4. **Report Issues**: Create an issue with detailed information

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **WebCrypto API**: For modern cryptographic operations
- **Chrome Extension APIs**: For browser integration
- **ECDSA-256**: For secure key pair generation
- **PBKDF2**: For secure key derivation
- **AES-256-GCM**: For authenticated encryption

## 🎯 Roadmap

### Future Features

- **Mobile Support**: iOS and Android versions
- **Key Synchronization**: Secure key sync across devices
- **Group Management**: Advanced group key management
- **Message History**: Encrypted message history
- **Advanced Security**: Additional security features

### Known Limitations

- **Chrome Only**: Currently only works in Chrome-based browsers
- **Local Storage**: Keys are not synced across devices
- **Manual Key Exchange**: Keys must be exchanged manually
- **Text Only**: Currently only supports text messages

## 🔒 Security Notice

This extension is designed for educational and personal use. While it implements strong cryptographic practices, users should:

- **Understand the Risks**: Encryption is only as strong as your key management
- **Keep Keys Secure**: Protect your private keys and passwords
- **Regular Backups**: Backup your keys regularly
- **Stay Updated**: Keep the extension updated for security patches

## 📞 Support

For support, issues, or questions:

1. **Check Documentation**: Review the guides and architecture
2. **Test Page**: Use the test page to verify functionality
3. **Console Logs**: Check browser console for error messages
4. **Create Issue**: Submit detailed issue reports

---

**Happy Encrypted Communicating! 🔒**

*Asocial - Keep your social media posts private and secure.*

