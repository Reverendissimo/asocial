# Asocial Chrome Extension - Installation Guide

## 🚀 Quick Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   - Clone or download the Asocial extension files
   - Extract to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Asocial - Encrypted Social Posts"
   - Click the pin icon to keep it visible

### Method 2: Install from Chrome Web Store (Future)

*Coming soon - the extension will be available on the Chrome Web Store*

## ✅ Current Status

**The extension is now FULLY WORKING with complete encryption/decryption functionality!**

- ✅ **Encryption**: Ctrl+Shift+E to encrypt messages with writer keys
- ✅ **Decryption**: Automatic decryption of encrypted messages on page load
- ✅ **Key Management**: Create, import, export writer/reader keys
- ✅ **Magic Code System**: Variable-length Base36 codes for key identification
- ✅ **Multi-KeyStore Support**: Multiple encrypted storage with password protection
- ✅ **Universal Compatibility**: Works on any website with text inputs

## 🔧 Initial Setup

### 1. Create Your First KeyStore

1. **Open the Extension**
   - Click the Asocial icon in your browser toolbar
   - You'll see the KeyStore selection panel

2. **Create New KeyStore**
   - Click "Create KeyStore"
   - Enter a name (e.g., "Personal", "Work", "Family")
   - Add an optional description
   - Set a strong password (minimum 8 characters)
   - Click "Create KeyStore"

3. **KeyStore Created Successfully**
   - You'll be automatically taken to the key management interface
   - Your KeyStore is now active and ready to use

### 2. Create Your Keys

#### Create a Writer Key (for encrypting messages you send)

1. **In the Key Management Panel**
   - Find the "Writer Keys" section
   - Click "+ Create Writer Key" button
   - Enter a name (e.g., "Public", "Friends", "Work")
   - Click "Create Key"

2. **Writer Key Created**
   - The key appears in your Writer Keys list
   - A corresponding reader key is automatically created
   - Click "Copy Reader Key" to export the complete JSON
   - Share this JSON with people you want to send encrypted messages to

#### Add a Reader Key (for decrypting messages you receive)

1. **In the Key Management Panel**
   - Find the "Reader Keys" section
   - Click "+ Add Reader Key" button
   - Paste the complete JSON from someone else
   - The system automatically extracts name, private key, and magic code
   - Click "Add Key"

2. **Reader Key Added**
   - The key appears in your Reader Keys list
   - This key is used to decrypt messages sent to you

## 🎯 How to Use

### Encrypting Messages

1. **On Any Website**
   - Type your message in any text input (Twitter, LinkedIn, Facebook, etc.)
   - Select the text you want to encrypt
   - Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac)

2. **Select Writer Key**
   - A popup will appear showing your available writer keys
   - Click on the key you want to use
   - The message will be encrypted and pasted automatically

3. **Send Your Message**
   - The encrypted message is now in your text input
   - Send it as normal - only people with the matching reader key can decrypt it

### Decrypting Messages

1. **Automatic Decryption**
   - When you visit a page with encrypted messages, they're automatically decrypted
   - Decrypted messages appear with `[ASOCIAL]` prefix and green styling
   - Only messages you can decrypt (with matching reader keys) will be shown

2. **Manual Decryption**
   - If automatic decryption fails, the message shows as `[ASOCIAL ENCRYPTED]`
   - This means you don't have the matching reader key

## 🔄 Key Exchange Process

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

## 🛠️ Troubleshooting

### Extension Not Working

1. **Check Extension is Enabled**
   - Go to `chrome://extensions/`
   - Make sure Asocial is enabled
   - Check for any error messages

2. **Reload the Extension**
   - Click the reload button on the extension
   - Try again

### Encryption Not Working

1. **Check You Have Writer Keys**
   - Open the extension popup
   - Make sure you have at least one writer key
   - Create one if needed

2. **Check Keyboard Shortcut**
   - Make sure you're pressing `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac)
   - Try selecting text first, then pressing the shortcut

### Decryption Not Working

1. **Check You Have Reader Keys**
   - Open the extension popup
   - Make sure you have reader keys for the messages you're trying to decrypt
   - Add the sender's reader key if needed

2. **Check Message Format**
   - Encrypted messages should start with `[ASOCIAL MAGIC_CODE]`
   - If the format is wrong, decryption won't work

### KeyStore Issues

1. **Forgot Password**
   - Unfortunately, KeyStore passwords cannot be recovered
   - You'll need to create a new KeyStore and re-add your keys

2. **KeyStore Not Loading**
   - Try closing and reopening the extension
   - Check if you're entering the correct password

## 🔒 Security Notes

- **Keep Your Passwords Safe**: KeyStore passwords cannot be recovered
- **Backup Your Keys**: Export your keys and store them safely
- **Use Strong Passwords**: At least 8 characters with mixed case, numbers, and symbols
- **Don't Share Private Keys**: Only share writer keys (public keys) with others

## 📞 Support

If you encounter issues:

1. **Check the Console**
   - Press F12 to open Developer Tools
   - Look for error messages in the Console tab
   - Take a screenshot of any errors

2. **Test on Simple Page**
   - Try the included `test_extension.html` file
   - This helps isolate if the issue is with the extension or the website

3. **Report Issues**
   - Include your Chrome version
   - Include the website where the issue occurred
   - Include any error messages from the console

## 🎉 You're Ready!

Your Asocial extension is now installed and configured. Start encrypting your social media posts and keep your conversations private!

Remember:
- Use `Ctrl+Shift+E` to encrypt messages
- Share your writer keys with people you want to communicate with
- Add their reader keys to decrypt their messages
- Keep your KeyStore password safe!

