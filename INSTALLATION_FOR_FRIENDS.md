# Asocial Extension - Installation Guide

## ⚠️ Important Notice

**This software is a Proof of Concept (PoC) for educational purposes only.**

- **NOT for production use** - This is experimental software
- **NOT reliable** - Do not use for protecting sensitive information
- **Use at your own risk** - No warranties or guarantees provided

## What is Asocial?
Asocial is a Chrome extension that demonstrates end-to-end encryption concepts for social media posts. You can encrypt your messages so only people with the right keys can read them. **This is for educational purposes only.**

## Installation Steps

### 1. Download the Extension
- Download the `asocial-extension.zip` file
- Extract it to a folder on your computer

### 2. Install in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the folder where you extracted the extension
5. The Asocial extension should now appear in your extensions list

### 3. Pin the Extension
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Asocial" and click the pin icon
3. The Asocial icon should now appear in your toolbar

## How to Use

### Creating Your First KeyStore
1. Click the Asocial icon in your toolbar
2. Click "Create KeyStore"
3. Enter a name and description
4. Set a strong password
5. Click "Create KeyStore"

### Creating Writer Keys
1. Open your KeyStore
2. Click "Create Writer Key"
3. Enter a name for your key
4. Your key is now ready to encrypt messages!

### Sharing Reader Keys
1. In your KeyStore, find your writer key
2. Click "Copy Reader Key"
3. Share the copied JSON with friends
4. They can import it to read your encrypted messages

### Importing Reader Keys
1. Click "Add Reader Key"
2. Paste the JSON you received from a friend
3. The key is now imported and ready to decrypt messages

### Encrypting Messages
1. Go to any website with text inputs (Twitter, Facebook, etc.)
2. Type your message normally
3. The extension will automatically encrypt it
4. Only people with your reader key can decrypt it

## Security Notes

**⚠️ IMPORTANT: This is experimental software for educational purposes only.**

- **Proof of Concept**: This is not production-ready or audited software
- **Educational Use**: Designed for learning about encryption concepts
- **No Guarantees**: No warranties about security, reliability, or functionality
- **Use at Your Own Risk**: All use is entirely at your own risk
- Keep your KeyStore password safe
- Only share reader keys with people you trust
- The extension works on any website with text inputs
- All encryption happens locally in your browser

## Troubleshooting
- Make sure the extension is enabled
- Check that you're on a website with text inputs
- Try refreshing the page if encryption doesn't work
- Make sure you have the right reader key for the message

## Support
If you have issues, contact the person who shared this extension with you.

---
**Asocial Extension v1.0.0**
*End-to-end encryption for social media*
