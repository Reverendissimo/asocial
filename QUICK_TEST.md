# Quick Testing Guide

## ✅ Latest Version: v2.6.1
All features are now working:
- ✅ Icon loading (PNG format)
- ✅ Popup sizing (600px width)
- ✅ Black & lime green theme
- ✅ RSA key generation (RSA-2048)
- ✅ Encryption modal with auto-encryption
- ✅ Chat message support for LinkedIn messaging
- ✅ Button injection and content preservation
- ✅ Key import with "magic" key IDs
- ✅ Secure URL sharing
- ✅ "Show Encrypted" toggle functionality
- ✅ **Reader key storage integration fixed** - Decryption now works properly

## 🚀 Test the Extension Now!

### Step 1: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select your `asocial` folder
5. You should see the extension with the anarchy symbol icon! 🔴

### Step 2: Test on LinkedIn
1. Go to LinkedIn.com and log in
2. Look for the anarchy symbol 🔴 in your browser toolbar
3. Click the extension icon to open the popup
4. Create a test group:
   - Click "Create New Group"
   - Name it "Test Group"
   - Click "Create Group"
5. Go to LinkedIn feed and try to create a post
6. Look for "Be Asocial" button next to the post button
7. Click "Be Asocial" - a modal will open with:
   - Message input area (pre-filled with your text)
   - Key selection list
   - Click any key to auto-encrypt
8. Post should be encrypted with `[ASOCIAL ABC12345]` format

### Step 2.5: Test LinkedIn Messaging
1. Go to LinkedIn messaging
2. Start a conversation
3. Look for "Be Asocial" button in the message input
4. Click "Be Asocial" and use the encryption modal
5. Send the encrypted message
6. The message should be automatically decrypted for you

### Step 3: Test Key Sharing & Decryption
1. Open the extension popup again
2. Export the public key for your test group (includes "magic" key ID)
3. In a different browser/incognito window:
   - Load the extension again
   - Import the JSON key you exported (includes key ID)
   - Go to LinkedIn and view the encrypted post
   - It should automatically decrypt
   - Click "Show Encrypted" to view original encrypted content
   - Click "Hide Encrypted" to return to decrypted view

## 🎯 What to Look For

- **Extension icon** appears in toolbar (red anarchy symbol)
- **Popup opens** when you click the icon
- **"Be Asocial" button** appears on LinkedIn post areas
- **Encrypted messages** show as `[ASOCIAL ABC12345] encrypted_content...`
- **Decryption works** when you have the right key

## 🐛 Troubleshooting

- **Extension won't load**: Check Chrome console for errors
- **No "Be Asocial" button**: Refresh LinkedIn page
- **Encryption fails**: Check browser console for JavaScript errors

Ready to test! 🚀
