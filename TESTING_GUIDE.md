# Testing the Asocial Chrome Extension

## Step 1: Create Basic Icons

First, create simple icon files in the `assets/` folder:

### Create icon16.png (16x16 pixels)
- Use any image editor or online tool
- Create a simple lock icon 🔒
- Save as `assets/icon16.png`

### Create icon48.png (48x48 pixels) 
- Same lock icon, larger size
- Save as `assets/icon48.png`

### Create icon128.png (128x128 pixels)
- Same lock icon, largest size  
- Save as `assets/icon128.png`

## Step 2: Load Extension in Chrome

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select the asocial folder** (the one with manifest.json)
5. **Extension should appear** in your extensions list

## Step 3: Test on LinkedIn

1. **Go to LinkedIn.com** and log in
2. **Look for the extension icon** in your browser toolbar
3. **Click the extension icon** to open the popup
4. **Create a test group:**
   - Click "Create New Group"
   - Name it "Test Group"
   - Click "Create Group"
5. **Go to LinkedIn feed** and try to create a post
6. **Look for "Be Asocial" button** next to the post button
7. **Click "Be Asocial"** and select your test group
8. **Post should be encrypted** with `[ASOCIAL ABC12345]` format

## Step 4: Test Decryption

1. **Open the extension popup** again
2. **Export the public key** for your test group
3. **In a different browser/incognito window:**
   - Load the extension again
   - Import the public key you exported
   - Go to LinkedIn and view the encrypted post
   - It should automatically decrypt

## Troubleshooting

### Extension won't load:
- Check that `manifest.json` is in the root folder
- Make sure all file paths in manifest are correct
- Check Chrome console for errors

### "Be Asocial" button not appearing:
- Refresh the LinkedIn page
- Check browser console for JavaScript errors
- Make sure you're on a supported LinkedIn page

### Encryption not working:
- Check browser console for errors
- Make sure you have a key group created
- Verify the extension has proper permissions

## Development Tips

- **Use Chrome DevTools** to debug
- **Check Console** for error messages
- **Reload extension** after making changes
- **Test in incognito mode** for clean testing

## Next Steps

Once basic testing works:
1. Test with multiple key groups
2. Test key sharing between users
3. Test on different LinkedIn pages
4. Test error handling (missing keys)
