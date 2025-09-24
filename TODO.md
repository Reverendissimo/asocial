# Chrome Extension for Multi-Recipient Encrypted Social Posts - TODO

## 🎉 Current Status: v2.7.1 - DECRYPTION FIX
**Latest features implemented!**
- ✅ Universal contextual menu approach
- ✅ Cross-platform compatibility (LinkedIn, Facebook, Twitter, Gmail, etc.)
- ✅ Right-click encryption on any website
- ✅ Keyboard shortcut (Ctrl+Shift+E)
- ✅ RSA-2048 + AES-256-GCM encryption
- ✅ Writer key and reader key system
- ✅ Key sharing with "magic" key IDs
- ✅ Secure URL sharing (no encrypted content exposure)
- ✅ "Show Encrypted" toggle functionality
- ✅ CSP compliance and proper event handling
- ✅ **NEW**: No platform-specific DOM hacking - clean, maintainable code
- ✅ **NEW**: Works on any website with text inputs
- ✅ **FIXED**: Decryption no longer interferes with input fields - encrypted text stays in place

## Project Overview
Build a Chrome extension that enables encrypted messaging on social media platforms (LinkedIn, Facebook, Twitter, etc.) using hybrid encryption for multiple recipients with encrypted local storage and multi-user support.

## 🚧 Phase 4: Encrypted Storage Architecture (CURRENT)

### 4.1 Encrypted Storage System
- [ ] Implement `.ASoc` file format for encrypted storage
- [ ] Create storage encryption using RSA-4096 + AES-256-GCM
- [ ] Implement PBKDF2 key derivation from storage name+password
- [ ] Add password requirements validation (8+ chars, complexity)
- [ ] Create storage file manager for multiple users
- [ ] Implement session-based authentication

### 4.2 Multi-User Support
- [ ] Add "Switch User" functionality
- [ ] Implement storage file selection interface
- [ ] Create user session management
- [ ] Add storage file backup/export functionality
- [ ] Implement storage file import functionality

### 4.3 UI Updates for Encrypted Storage
- [ ] Create login screen for storage name+password entry
- [ ] Add "Switch User" button to main interface
- [ ] Update all storage operations to use encrypted storage
- [ ] Add storage file management interface
- [ ] Update key management to work with encrypted storage

### 4.4 Security Enhancements
- [ ] Remove plain text storage completely
- [ ] Implement secure key storage in encrypted vaults
- [ ] Add session timeout functionality
- [ ] Implement secure password handling
- [ ] Add storage integrity verification

## Phase 1: Project Setup & Foundation

### 1.1 Chrome Extension Structure
- [x] Create `manifest.json` with Chrome Manifest V3 configuration
- [x] Set up required permissions: `activeTab`, `storage`, `clipboardWrite`, `clipboardRead`
- [x] Create basic extension directory structure:
  - [x] `popup/` - Popup UI components
  - [x] `content/` - Content scripts for social platforms
  - [x] `background/` - Background service worker
  - [x] `utils/` - Shared utilities and crypto functions
  - [x] `assets/` - Icons, images, styles

### 1.2 Development Environment
- [ ] Set up build system (Webpack/Vite) for TypeScript/JavaScript bundling
- [ ] Configure ESLint and Prettier for code quality
- [ ] Set up testing framework (Jest/Mocha)
- [ ] Create development scripts for building and testing

## Phase 2: Key Management System

### 2.1 Cryptographic Key Generation
- [ ] Implement RSA-4096 key pair generation using WebCrypto API (maximum security)
- [ ] Implement ECC-521 key pair generation as alternative (highest ECC security)
- [ ] Create key validation functions
- [ ] Add key strength configuration options (4096-bit RSA, 521-bit ECC)
- [ ] Implement RSA-4096 as default for maximum security
- [ ] Add key generation performance optimization for large keys

### 2.2 Key Storage & Security
- [ ] Implement secure private key storage with master passphrase encryption (local only)
- [ ] Create key derivation function (Argon2id with maximum parameters) for master passphrase
- [ ] Implement secure key export/import functionality
- [ ] Add encrypted cloud export functionality (keys always encrypted with master passphrase)
- [ ] Create key backup and recovery mechanisms
- [ ] Implement end-to-end encryption focus with no plaintext key exposure
- [ ] Add key rotation and expiration features
- [ ] Create master passphrase strength validation and requirements
- [ ] Implement Argon2id with maximum security parameters (memory: 64MB, iterations: 3, parallelism: 4)
- [ ] Add key storage encryption with AES-256-GCM (maximum symmetric security)

### 2.3 Recipient Management
- [x] Design recipient database schema (single shared key per group)
- [x] Implement single encryption key group management
- [x] Implement public key generation and distribution system for each group
- [x] Implement external file import/export (.pem, .json formats)
- [ ] Implement QR code generation for public key sharing
- [ ] Implement QR code scanning for public key import
- [x] Create recipient verification system
- [x] Add recipient groups and batch operations
- [x] Implement recipient key validation and trust levels
- [ ] Create automatic contact key discovery from LinkedIn connections
- [x] Implement contact key management for LinkedIn connections
- [x] Add named key group creation and management (e.g., "Family", "Work", "Close Friends")
- [x] Implement key group assignment to contacts

## Phase 3: Encryption Engine

### 3.1 Broadcast Encryption Implementation
- [ ] Implement AES-256-GCM symmetric encryption for message content (maximum symmetric security)
- [ ] Create random symmetric key generation for each post (cryptographically secure random)
- [ ] Implement RSA-4096 encryption with your private key (maximum RSA security)
- [ ] Create payload structure: [encrypted_content] + [encrypted_symmetric_key]
- [ ] Add encryption metadata (timestamp, algorithm, version)
- [ ] Implement multiple private keys for you (one per key group), multiple public keys for different contact groups
- [ ] Add RSA-4096 performance optimization for large key operations
- [ ] Implement secure random number generation for all cryptographic operations

### 3.2 Digital Signatures
- [ ] Implement RSA-4096 message signing with sender's private key (maximum signature security)
- [ ] Create signature verification system with RSA-4096 public key
- [ ] Add signature validation and trust verification
- [ ] Implement signature display in UI
- [ ] Add SHA-512 hashing for signature generation (maximum hash security)
- [ ] Implement signature performance optimization for large keys

### 3.3 Payload Management
- [ ] Design JSON payload structure for encrypted messages
- [ ] Implement Base64 encoding/decoding for payload
- [ ] Create payload compression for large messages
- [ ] Add payload integrity verification
- [ ] Implement payload versioning and migration
- [ ] Add [ASOCIAL MESSAGE] tag prefix for encrypted message identification
- [ ] Implement tag-based message detection and parsing
- [ ] Implement platform-specific message size limits (LinkedIn: 3000 chars, etc.)
- [ ] Add message size validation before encryption
- [ ] Create size limit warnings and user notifications

## Phase 4: Content Script Integration

### 4.1 Social Platform Detection
- [ ] Create modular platform detection system (LinkedIn first, easily expandable)
- [ ] Implement LinkedIn-specific DOM selectors for text input areas
- [ ] Create platform configuration system for easy expansion
- [ ] Add generic text input detection (`<textarea>`, `contenteditable`) as fallback
- [ ] Implement automatic recipient discovery from LinkedIn conversation context
- [ ] Add LinkedIn connection-based recipient suggestion system
- [ ] Create smart recipient filtering and validation
- [ ] Design platform-agnostic DOM injection system for easy expansion

### 4.2 UI Injection
- [ ] Design and implement "Be Asocial" button injection next to LinkedIn post button
- [ ] Create modular UI injection system for easy platform expansion
- [ ] Implement message status indicators
- [ ] Add automatic recipient detection from LinkedIn connections
- [ ] Create encryption progress indicators
- [ ] Design platform-agnostic UI components
- [ ] Implement LinkedIn-specific styling and positioning
- [ ] Add "Be Asocial" button styling to match LinkedIn's design
- [ ] Create encryption key selection dropdown when clicking "Be Asocial"
- [ ] Implement named encryption key groups (e.g., "Family", "Work", "Close Friends")
- [ ] Add key group management interface

### 4.3 Message Processing
- [ ] Implement message content extraction from LinkedIn post input
- [ ] Create "Be Asocial" button click handler with key selection
- [ ] Implement encryption key selection dropdown
- [ ] Add encrypted message replacement in LinkedIn post field
- [ ] Implement message validation and sanitization
- [ ] Add platform-specific size limit checking (LinkedIn focus)
- [ ] Implement size limit warnings before encryption
- [ ] Create message truncation handling for oversized content
- [ ] Add platform-specific character counting
- [ ] Implement group-based encryption (only selected group can decrypt)

## Phase 5: Decryption System

### 5.1 Message Detection
- [ ] Create encrypted message detection algorithms using [ASOCIAL MESSAGE] tag
- [ ] Implement payload parsing and validation
- [ ] Add message metadata extraction
- [ ] Create message classification system
- [ ] Implement tag-based message filtering and highlighting

### 5.2 Decryption Engine
- [ ] Implement symmetric key decryption for each recipient
- [ ] Create message content decryption
- [ ] Add decryption error handling and fallbacks
- [ ] Implement decryption performance optimization
- [ ] Add "Cannot decrypt" error detection and display
- [ ] Create recipient key validation before decryption attempts
- [ ] Implement helpful error messages for missing keys/extension

### 5.3 Message Display
- [ ] Create automatic inline message replacement system for LinkedIn posts
- [ ] Implement decrypted message styling to match LinkedIn's design
- [ ] Add sender verification display
- [ ] Create message history and threading
- [ ] Implement encrypted message display with visual indicators
- [ ] Add "This message is encrypted but you cannot decrypt it" display
- [ ] Create helpful tooltips for encryption status
- [ ] Implement graceful degradation for missing keys
- [ ] Add automatic decryption on page load for LinkedIn posts

## Phase 6: User Interface

### 6.1 Popup Interface
- [ ] Design popup layout and navigation with mode switching
- [ ] Implement simple mode interface (beginner-friendly)
- [ ] Implement advanced mode interface (technical users)
- [ ] Create key management interface with guided setup
- [ ] Create recipient management panel with copy/paste key functionality
- [ ] Add file import/export interface for keys
- [ ] Add QR code generation and scanning interface
- [ ] Add encryption settings and preferences with mode-specific options
- [ ] Implement encryption history viewer
- [ ] Create user onboarding flow with mode selection
- [ ] Add encryption key group management interface
- [ ] Implement named key group creation and editing
- [ ] Add key group assignment to contacts
- [ ] Create key group selection interface for encryption

### 6.2 Inline UI Components
- [ ] Create encryption status indicators
- [ ] Implement decryption success/failure notifications
- [ ] Add toggle between encrypted/decrypted views
- [ ] Create recipient list display
- [ ] Implement sender verification badges
- [ ] Add [ASOCIAL MESSAGE] tag styling and visual indicators
- [ ] Create encrypted message highlighting and borders
- [ ] Implement "Encrypted but cannot decrypt" visual indicators
- [ ] Add "Recipient needs extension" notification system
- [ ] Create "Missing key" error display with helpful messages

### 6.3 Settings & Configuration
- [ ] Create simple mode settings (basic encryption, guided setup)
- [ ] Create advanced mode settings (algorithm selection, key strength)
- [ ] Implement key strength configuration with recommendations (RSA-4096 default)
- [ ] Add platform-specific settings including size limits
- [ ] Create backup and restore interface with master passphrase
- [ ] Implement encrypted cloud export/import settings
- [ ] Add master passphrase management interface
- [ ] Implement privacy and security settings
- [ ] Create end-to-end encryption status indicators
- [ ] Add mode switching interface with feature explanations
- [ ] Add platform-specific size limit configuration
- [ ] Create size limit override settings for advanced users
- [ ] Add RSA-4096 performance settings and optimization options
- [ ] Implement maximum security mode with all highest settings enabled

## Phase 7: Security Implementation

### 7.1 WebCrypto API Integration
- [ ] Implement all encryption using WebCrypto API
- [ ] Create secure random number generation
- [ ] Implement secure key derivation
- [ ] Add cryptographic operation validation

### 7.2 Client-Side Security
- [ ] Ensure all operations are client-side only
- [ ] Implement secure memory management
- [ ] Create input/output sanitization
- [ ] Add XSS and injection attack prevention

### 7.3 Key Security
- [ ] Implement secure local key storage with master passphrase encryption
- [ ] Create key access control with passphrase verification
- [ ] Add key usage logging and monitoring (encrypted)
- [ ] Implement key destruction on extension removal
- [ ] Ensure keys are NEVER stored in plaintext
- [ ] Implement encrypted cloud export with master passphrase
- [ ] Add key encryption verification and validation

## Phase 8: Testing & Quality Assurance

### 8.1 Unit Testing
- [ ] Test cryptographic functions
- [ ] Test key generation and management
- [ ] Test encryption/decryption workflows
- [ ] Test UI components and interactions

### 8.2 Integration Testing
- [ ] Test on LinkedIn platform (primary focus)
- [ ] Test LinkedIn messaging, posts, and comments
- [ ] Test LinkedIn connection-based recipient discovery
- [ ] Test LinkedIn character limits (3000 chars) and size validation
- [ ] Test platform expansion system with mock platforms
- [ ] Test cross-platform compatibility (Facebook, Twitter as secondary)
- [ ] Test DOM selector system for easy platform addition
- [ ] Test message size limit handling across platforms

### 8.3 Security Testing
- [ ] Test key storage security
- [ ] Test encryption strength
- [ ] Test signature verification
- [ ] Test against common attack vectors
- [ ] Perform penetration testing

### 8.4 User Testing
- [ ] Test multi-recipient scenarios
- [ ] Test key exchange workflows
- [ ] Test user experience flows
- [ ] Test error handling and recovery

## Phase 9: Documentation & Deployment

### 9.1 User Documentation
- [ ] Create simple mode installation guide (beginner-friendly)
- [ ] Create advanced mode installation guide (technical users)
- [ ] Write key exchange instructions for both modes
- [ ] Create encryption workflow guide with mode-specific instructions
- [ ] Add troubleshooting documentation for both user types
- [ ] Create security best practices guide
- [ ] Add mode comparison and feature explanation guide

### 9.2 Developer Documentation
- [ ] Document API interfaces
- [ ] Create code documentation
- [ ] Write security considerations
- [ ] Add contribution guidelines
- [ ] Create architecture documentation

### 9.3 Packaging & Distribution
- [ ] Create Chrome Web Store package
- [ ] Implement auto-update mechanism
- [ ] Create installation verification
- [ ] Add telemetry and analytics (privacy-preserving)
- [ ] Implement user feedback system

## Phase 10: Advanced Features

### 10.1 Enhanced Security
- [ ] Implement perfect forward secrecy
- [ ] Add message expiration
- [ ] Create key rotation automation
- [ ] Implement secure key exchange protocols

### 10.2 User Experience
- [ ] Add message threading
- [ ] Implement conversation encryption
- [ ] Create group encryption features
- [ ] Add message search and filtering

### 10.3 Platform Integration
- [ ] Add support for Facebook, Twitter, and other platforms using modular system
- [ ] Implement platform-specific DOM selectors and optimizations
- [ ] Create mobile browser support
- [ ] Add cross-browser compatibility
- [ ] Expand platform configuration system for easy addition of new platforms

## Questions for Clarification

Before proceeding with implementation, I need clarification on:

1. **Key Exchange Method**: ✅ **RESOLVED** - Extension popup (copy/paste), external files (.pem, .json), and QR codes

2. **Recipient Discovery**: ✅ **RESOLVED** - Automatic recipient discovery from conversation context and platform connections

3. **Message Format**: ✅ **RESOLVED** - Encrypted messages prefixed with [ASOCIAL MESSAGE] tag for easy identification

4. **Key Storage**: ✅ **RESOLVED** - Local-only storage with end-to-end encryption focus, optional encrypted cloud export with master passphrase

5. **Platform Priority**: ✅ **RESOLVED** - LinkedIn first with modular, easily expandable system based on DOM identification

6. **User Onboarding**: ✅ **RESOLVED** - Tiered approach with simple mode (beginner-friendly) and advanced mode (technical users)

7. **Error Handling**: ✅ **RESOLVED** - Visual indicators for encrypted messages that cannot be decrypted, with helpful error messages

8. **Message Size Limits**: ✅ **RESOLVED** - Platform-specific size limits (LinkedIn: 3000 chars, etc.) with validation and warnings

## Implementation Summary

All clarification questions have been resolved:

✅ **Key Exchange Method**: Extension popup (copy/paste), external files (.pem, .json), and QR codes  
✅ **Recipient Discovery**: Automatic recipient discovery from conversation context and platform connections  
✅ **Message Format**: Encrypted messages prefixed with [ASOCIAL MESSAGE] tag for easy identification  
✅ **Key Storage**: Local-only storage with end-to-end encryption focus, optional encrypted cloud export with master passphrase  
✅ **Platform Priority**: LinkedIn first with modular, easily expandable system based on DOM identification  
✅ **User Onboarding**: Tiered approach with simple mode (beginner-friendly) and advanced mode (technical users)  
✅ **Error Handling**: Visual indicators for encrypted messages that cannot be decrypted, with helpful error messages  
✅ **Message Size Limits**: Platform-specific size limits (LinkedIn: 3000 chars, etc.) with validation and warnings  

## Core Workflow Clarification

**User Experience Flow:**
1. User writes post normally on LinkedIn
2. "Be Asocial" button appears next to the post button
3. Clicking "Be Asocial" shows encryption key selection dropdown
4. User selects which key group to encrypt for (e.g., "Family", "Work", "Close Friends")
5. Post is encrypted with selected key group and published with [ASOCIAL MESSAGE] tag
6. Only recipients with the correct public key can decrypt the content
7. Recipients without the extension see encrypted content with visual indicators

## Key Management Architecture

**Encryption Approach:**
- **You have multiple private keys** (one per key group: "Family", "Work", "Close Friends")
- **Each key group has its own public key** (distributed to specific contacts)
- **When encrypting a post:**
  1. Select which key group to encrypt for
  2. Generate random AES-256 symmetric key
  3. Encrypt post content with symmetric key
  4. Encrypt symmetric key with selected group's private key
  5. Create payload: `[encrypted_content] + [encrypted_symmetric_key]` (only that group can decrypt)

**Decryption Approach:**
- Only contacts with the correct public key can decrypt
- Decrypt the symmetric key, then decrypt the post content
- **Group-based encryption: only selected group can decrypt**

The project is now ready for implementation with all requirements clearly defined.
