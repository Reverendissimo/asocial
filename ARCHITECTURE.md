# Asocial Chrome Extension - Architecture

## 🎯 Core Vision
A Chrome extension that enables encrypted messaging on ANY website using a clean, maintainable architecture with multi-user encrypted storage and universal platform support.

## 🏗️ Architecture Overview

### 1. **Background Service Worker (Main Worker)**
The central component that manages all core functionality:

#### **Key Storage Management**
- **Multiple KeyStores**: Support for multiple encrypted storage objects
- **Active KeyStore**: Only one KeyStore is active at a time
- **Memory Management**: Keep active KeyStore in memory for UI panels
- **KeyStore File Structure** (JSON):
  ```javascript
  KeyStore = {
    name: "User's KeyStore Name", // string
    createdAt: "datetime", // creation timestamp
    writerKeys: [], // LIST of encrypted writer keys
    readerKeys: []  // LIST of encrypted reader keys
  }
  ```

#### **KeyStore File Encryption**
- **PBKDF2**: Derive encryption key from user password
- **AES-256-GCM**: Encrypt entire KeyStore file with derived key
- **Authenticated Encryption**: GCM provides file integrity verification
- **WebCrypto API**: Native browser cryptographic functions

#### **Individual Key Encryption in Storage**
- **KeyStore Password**: Use same password for individual key encryption
- **PBKDF2**: Derive key from password for key encryption
- **AES-256-GCM**: Encrypt each key individually
- **Base64 Encoding**: Encrypted keys are B64 encoded before JSON storage
- **Decryption Process**: B64 decode → decrypt with derived key → get actual key

#### **Key Types**
- **Writer Keys**: Public keys for encrypting messages you send
- **Reader Keys**: Private keys for decrypting messages you receive (auto-generated with writer keys)
- **Magic Code System**: 7-character Base36 codes for key identification
- **Key Structure** (in memory):
  ```javascript
  Key = {
    id: "unique_key_id",
    name: "Key Name (e.g., Family, Work)",
    type: "writer" | "reader",
    publicKey: "base64_encoded_public_key", // For writer keys
    privateKey: "base64_encoded_private_key", // For reader keys
    magicCode: "ABC1234", // 7-character Base36 magic code
    createdAt: "timestamp"
  }
  ```

#### **Key Encryption Process**
- **Save to File**: Key → PBKDF2 derive key → AES-256-GCM encrypt → B64 encode → store in JSON list
- **Load from File**: B64 decode → AES-256-GCM decrypt with derived key → get actual key
- **Memory Storage**: Worker keeps decrypted keys in memory for fast access
- **Password Derivation**: Worker derives encryption key from password using PBKDF2

#### **Worker Responsibilities**
1. **KeyStore Management**: Create, load, switch between KeyStores
2. **Key Operations**: Generate, import, export, delete keys
3. **Encryption/Decryption**: Handle all cryptographic operations
4. **Memory State**: Keep active KeyStore and keys in memory
5. **UI Communication**: Provide data to popup and content scripts
6. **Immediate Persistence**: Save keys to file immediately when added from UI
7. **Encryption Interface**: Provide UI with encryption functionality
8. **Key Listing**: Provide UI with available writer and reader keys list

#### **Key Addition Process**
- **UI → Worker**: When UI adds new key (writer or reader), send immediately to worker
- **Worker → File**: Worker immediately encrypts key with password hash, B64 encodes, and saves to KeyStore file
- **Memory Update**: Worker updates in-memory KeyStore with new key
- **No Delays**: No batching or queuing - immediate save on every key addition

#### **Key Security Architecture**
- **Key Generation**: All key generation happens in the worker (never in UI)
- **Key Storage**: Worker stores keys encrypted in memory and file
- **UI Interface**: UI provides interface for create/delete/info operations
- **No Key Exposure**: UI never receives actual key data, only metadata
- **Worker-Only Access**: Only worker can access decrypted keys for encryption/decryption

#### **Worker Encryption Interface**
- **Encrypt Message**: UI sends message + writer key ID → Worker encrypts with ECDSA public key
- **Decrypt Message**: Worker decrypts with ECDSA private key (reader key)
- **Magic Code Generation**: Worker generates 7-character Base36 magic code from reader key
- **Magic Code Lookup**: Worker finds reader key by magic code for decryption
- **Key Listing**: Worker provides list of available writer and reader keys (metadata only)
- **Key Selection**: UI can request encryption with specific writer key by ID
- **Encrypted Output**: Worker returns encrypted message with magic code to UI
- **No Key Exposure**: Worker never sends actual key data to UI

### 2. **Content Script (Universal)**
Works on ANY website with text inputs:

#### **Core Functionality**
- **Text Selection Detection**: Detect when user selects text
- **Encryption Modal**: Show modal for key selection and encryption
- **Magic Code Detection**: Scan DOM for `[ASOCIAL MAGIC_CODE]` patterns (displayed content only)
- **Text-Only Decryption**: Replace encrypted text with decrypted content (no DOM manipulation)
- **Reader Key Lookup**: Use magic code to identify correct reader key for decryption
- **Own Message Decryption**: Decrypt our own encrypted messages for display
- **No Input Box Decryption**: Do NOT attempt to decrypt content in input fields, textareas, or contentEditable elements
- **Universal Compatibility**: Work on LinkedIn, Facebook, Twitter, Gmail, Reddit, Discord, Slack, etc.

#### **User Interactions**
- **Right-click Menu**: "Encrypt with Asocial" on selected text
- **Keyboard Shortcut**: Ctrl+Shift+E for quick encryption
- **Automatic Text Selection**: Ctrl+Shift+E automatically sends Ctrl+A to select all text in current input
- **Encryption Popup**: Opens popup window to select writer key
- **Automatic Encryption**: Once writer key selected, encrypts message and copies to clipboard
- **Automatic Pasting**: Selects all text again and pastes encrypted text
- **Clipboard Integration**: Uses modern clipboard API with fallback to execCommand
- **Input Field Detection**: Works with textarea, input fields, and contentEditable elements

#### **Message Display**
- **Magic Code Detection**: Recognize `[ASOCIAL MAGIC_CODE]` pattern in DOM text (displayed content only)
- **Text-Only Replacement**: Replace text content only, no DOM manipulation
- **Decrypted Messages**: Show as `[ASOCIAL] decrypted text` with green styling
- **Encrypted Messages**: Show as `[ASOCIAL ENCRYPTED] encrypted text` when decryption fails
- **Green Styling**: Attempt to style decrypted text with green on black background
- **No DOM Breaking**: Simple text content replacement without affecting page structure
- **No Input Box Decryption**: Do NOT decrypt content in input fields, textareas, or contentEditable elements
- **Own Message Decryption**: Decrypt our own encrypted messages for display

### 3. **Popup Interface**
Single panel KeyStore management interface:

#### **Main Functions**
- **Single Panel Design**: One panel with dynamic DOM manipulation
- **KeyStore Selection**: Primary interface for selecting active KeyStore
- **KeyStore Creation**: Create new KeyStore with name and optional description
- **KeyStore Opening**: After creation, automatically open KeyStore and go to key creation interface
- **KeyStore Management**: Create, open, switch between KeyStores
- **Writer Key Management**: Create, export, delete writer keys (UI interface only)
- **Reader Key Management**: Import reader keys from others (UI interface only)
- **Authentication**: Password protection for KeyStores
- **Key Metadata**: Display key information (name, type, created date) without exposing actual keys
- **Encryption Interface**: Request encryption with specific writer key
- **Key Selection**: Choose from available writer keys for encryption

#### **UI Design (Hackish Black & Lime)**
- **Color Scheme**: BLACK background, LIME green text and borders only
- **Minimal Design**: Small buttons, compact labels, hackish aesthetic
- **No Big Elements**: Keep interface minimal and functional
- **Terminology**: KeyStore, Writer Keys, Reader Keys (NO login/user/contact terminology)

#### **UI Components (Single Panel)**
- **Dynamic DOM Manipulation**: Add and remove DOM elements as required
- **KeyStore Selection Panel**: Primary interface for selecting active KeyStore
- **KeyStore Creation**: Create new KeyStore with name and optional description
- **KeyStore List**: Display available KeyStores with names and descriptions
- **KeyStore Close Button**: Close current KeyStore and return to selection panel
- **KeyStore Import/Export**: Export KeyStore to file and import from file
- **Key Creation Interface**: After KeyStore creation, go to key creation interface
- **Writer Keys Section**: Display writer keys with create button and delete icons
- **Reader Keys Section**: Display reader keys with add (copy/paste) button and delete icons
- **Key Operations Interface**: Create, import, export, delete key operations (UI only)
- **Key Information Display**: Show key details without exposing actual key data
- **Encryption Modal**: Interface for selecting writer key and encrypting messages
- **Key Selection Interface**: Choose from available writer keys for encryption

### 4. **KeyStore Access Interface**
Authentication system for KeyStore access (integrated into single panel):

#### **KeyStore Operations**
- **Single Panel Integration**: All KeyStore operations in one panel
- **Dynamic DOM Manipulation**: Add and remove DOM elements as required
- **KeyStore Selection**: Primary interface for selecting active KeyStore
- **Create New KeyStore**: Set name, optional description, and password
- **KeyStore Opening**: After creation, automatically open KeyStore and go to key creation interface
- **Open Existing KeyStore**: Select and authenticate
- **Close KeyStore**: Close current KeyStore and return to selection panel
- **Switch KeyStore**: Change active KeyStore
- **Multiple KeyStores**: Create as many KeyStores as needed (each is a different file)
- **Password Protection**: Secure access to encrypted storage
- **KeyStore List**: Display available KeyStores with names and descriptions

#### **Key Management Interface**
- **Writer Keys Section**: Display writer keys with create button, copy reader key button, and delete icons
- **Reader Keys Section**: Display reader keys with add (JSON import) button and delete icons
- **Create Writer Key Button**: Button to create new writer key (auto-generates reader key)
- **Copy Reader Key Button**: Export complete JSON with name, private key, and magic code
- **Add Reader Key Button**: Button to import JSON reader key from others
- **JSON Export/Import**: Complete key data with name, private key, and magic code
- **Key Visualization**: Separate display for writer and reader keys
- **Delete Key Icons**: Every key has a delete icon
- **Immediate Updates**: All key modifications immediately updated in worker memory and file

#### **KeyStore Import/Export**
- **Export KeyStore**: Export current KeyStore to file (encrypted with password)
- **Import KeyStore**: Import KeyStore from file (requires password authentication)
- **File Format**: Each KeyStore is a separate encrypted file
- **Multiple KeyStores**: Support for unlimited number of KeyStores
- **KeyStore Files**: Each KeyStore stored as separate encrypted file
- **Password Protection**: Import/export requires password authentication

#### **Encryption Workflow**
- **Text Selection**: User selects text in any input field
- **Keyboard Shortcut**: Ctrl+Shift+E triggers encryption
- **Automatic Selection**: Ctrl+Shift+E automatically selects all text in current input field
- **Key Selection**: Popup shows available writer keys with names and storage info
- **Encryption**: Selected text is encrypted with chosen writer key
- **Clipboard Copy**: Encrypted text is copied to clipboard
- **Automatic Pasting**: Text is selected again and pasted automatically
- **Magic Code**: Encrypted message includes magic code for decryption
- **Input Field Support**: Works with textarea, input fields, and contentEditable elements

#### **UI Design (Hackish Black & Lime)**
- **Color Scheme**: BLACK background, LIME green text and borders only
- **Minimal Design**: Small buttons, compact labels, hackish aesthetic
- **No Big Elements**: Keep interface minimal and functional
- **Terminology**: KeyStore, Writer Keys, Reader Keys (NO login/user/contact terminology)

## 🔐 Security Architecture

### **Encryption System**
- **ECDSA-256**: Modern elliptic curve encryption for message encryption/decryption
- **PBKDF2 + AES-256-GCM**: KeyStore file encryption and individual key encryption
- **WebCrypto API**: Browser-native cryptographic functions
- **Dual Algorithm**: ECDSA for messages, AES for storage
- **Modern Standard**: Industry standard for new applications

### **Key Management**
- **Magic Code System**: Unique identifiers for automatic key matching
- **Message Tagging**: `[ASOCIAL MAGIC_CODE] encrypted_content`
- **Magic Code Generation**: Base36, 7 characters, 78.3 billion combinations
- **Generated from Reader Key**: Magic code derived from reader key for uniqueness
- **Automatic Decryption**: Key lookup by magic code for fast decryption
- **Secure Storage**: Encrypted KeyStore files with password protection

### **Multi-KeyStore Support**
- **Separate KeyStores**: Each KeyStore has its own encrypted storage
- **Session Management**: Password required for each session
- **Key Sharing**: Export/import keys between KeyStores
- **Isolation**: KeyStores can't access each other's data

## 🌐 Universal Platform Support

### **Platform Compatibility**
- **Any Website**: Works on LinkedIn, Facebook, Twitter, Gmail, Reddit, Discord, Slack, etc.
- **Text Input Detection**: Automatically detects text input fields
- **Universal Content Script**: No platform-specific code
- **Cross-Platform**: Same functionality everywhere

### **User Experience**
- **Consistent Interface**: Same experience across all platforms
- **Automatic Detection**: No manual platform configuration
- **Simple Integration**: Works with any website's text inputs
- **No Breaking**: Doesn't interfere with website functionality

## 📁 File Structure

```
asocial/
├── manifest.json              # Extension manifest
├── background/
│   └── background.js          # Main service worker
├── content/
│   ├── universal.js           # Universal content script
│   └── universal.css          # Universal styles
├── popup/
│   ├── popup.html             # Main UI
│   ├── popup.js               # Main UI logic
│   ├── popup.css              # Main UI styles
│   ├── login.html             # Login interface
│   ├── login.js               # Login logic
│   └── login.css              # Login styles
├── utils/
│   ├── crypto.js              # Cryptographic functions
│   ├── keyManager.js          # Key management
│   └── storage.js             # Storage management
└── assets/
    ├── icon16.png             # Extension icons
    ├── icon48.png
    └── icon128.png
```

## 🎯 Key Principles

### **Clean Architecture**
- **Separation of Concerns**: Each component has clear responsibilities
- **Minimal Dependencies**: Reduce coupling between components
- **Single Responsibility**: Each function does one thing well
- **Maintainable Code**: Easy to understand and modify

### **User Experience**
- **Simple Interface**: Easy to use for non-technical users
- **Automatic Operations**: Minimize manual steps
- **Universal Compatibility**: Works everywhere
- **No Breaking**: Doesn't interfere with websites

### **Security First**
- **Client-Side Only**: All encryption happens locally
- **No Server Dependencies**: No external services required
- **Secure Storage**: Encrypted local storage
- **Key Isolation**: Users can't access each other's keys

## 🚀 Success Criteria

### **Functional Requirements**
- ✅ Works on ANY website with text inputs
- ✅ Multi-user encrypted storage system
- ✅ Writer/Reader key management
- ✅ Automatic text selection and pasting
- ✅ Simple text display for decrypted messages
- ✅ No DOM breaking or website interference

### **Technical Requirements**
- ✅ Clean, maintainable code architecture
- ✅ Universal content script approach
- ✅ Secure cryptographic implementation
- ✅ Efficient key management system
- ✅ Robust error handling and user feedback

### **User Experience Requirements**
- ✅ Intuitive interface for key management
- ✅ Automatic encryption/decryption
- ✅ Consistent experience across platforms
- ✅ Fast and responsive operations
- ✅ Clear error messages and feedback

This architecture provides a solid foundation for building a clean, maintainable, and secure encrypted messaging Chrome extension.
