# Quick Testing Guide

## ✅ Latest Version: v2.7
All features are now working:
- ✅ Icon loading (PNG format)
- ✅ Popup sizing (600px width)
- ✅ Black & lime green theme
- ✅ RSA key generation (RSA-2048)
- ✅ Universal contextual menu approach
- ✅ Cross-platform compatibility (LinkedIn, Facebook, Twitter, Gmail, etc.)
- ✅ Right-click encryption on any website
- ✅ Keyboard shortcut (Ctrl+Shift+E)
- ✅ Automatic decryption detection
- ✅ Key import with "magic" key IDs
- ✅ Secure URL sharing
- ✅ "Show Encrypted" toggle functionality
- ✅ **No platform-specific DOM hacking** - Clean, maintainable code

## 🚀 Test the Extension Now!

### Step 1: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select your `asocial` folder
5. You should see the extension with the anarchy symbol icon! 🔴

### Step 2: Test Universal Encryption
1. Go to any website (LinkedIn, Facebook, Twitter, Gmail, etc.)
2. Look for the anarchy symbol 🔴 in your browser toolbar
3. Click the extension icon to open the popup
4. Create a test writer key:
   - Click "Create New Writer Key"
   - Name it "Test Key"
   - Click "Create Writer Key"
5. **Test Right-Click Encryption**:
   - Select any text in any input field
   - Right-click → "Encrypt with Asocial"
   - Choose your writer key
   - Text should be encrypted and replaced
6. **Test Keyboard Shortcut**:
   - Select text in any input field
   - Press Ctrl+Shift+E
   - Choose your writer key
   - Text should be encrypted and replaced

### Step 3: Test Key Sharing & Decryption
1. Open the extension popup again
2. Export the writer key for your test key (includes "magic" key ID)
3. In a different browser/incognito window:
   - Load the extension again
   - Import the JSON key you exported (includes key ID)
   - Go to any website and view the encrypted message
   - It should automatically decrypt
   - Click "Show Encrypted" to view original encrypted content
   - Click "Hide Encrypted" to return to decrypted view

## 🎯 What to Look For

- **Extension icon** appears in toolbar (red anarchy symbol)
- **Popup opens** when you click the icon
- **Right-click menu** shows "Encrypt with Asocial" option
- **Keyboard shortcut** Ctrl+Shift+E works on any website
- **Encrypted messages** show as `[ASOCIAL ABC12345] encrypted_content...`
- **Decryption works** when you have the right key

## 🐛 Troubleshooting

- **Extension won't load**: Check Chrome console for errors
- **No right-click menu**: Check if extension is enabled
- **Encryption fails**: Check browser console for JavaScript errors

Ready to test! 🚀
