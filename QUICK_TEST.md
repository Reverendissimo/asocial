# Quick Testing Guide

## ✅ Icons Created!
I've created anarchy symbol icons in SVG format:
- `assets/icon16.svg` (16x16)
- `assets/icon48.svg` (48x48) 
- `assets/icon128.svg` (128x128)

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
7. Click "Be Asocial" and select your test group
8. Post should be encrypted with `[ASOCIAL ABC12345]` format

### Step 3: Test Decryption
1. Open the extension popup again
2. Export the public key for your test group
3. In a different browser/incognito window:
   - Load the extension again
   - Import the public key you exported
   - Go to LinkedIn and view the encrypted post
   - It should automatically decrypt

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
