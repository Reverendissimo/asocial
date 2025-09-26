# Asocial Key Exchange Guide

## 🔑 Understanding Keys

### Key Types

**Writer Keys (Public Keys)**
- Used to encrypt messages you send
- Safe to share with anyone
- Can be posted publicly
- Multiple people can use the same writer key

**Reader Keys (Private Keys)**
- Used to decrypt messages you receive
- Must be kept private and secure
- Never share these keys
- Each person has their own unique reader key

## ✅ Current Status

**The key exchange system is now FULLY WORKING!**

- ✅ **Magic Code System**: Variable-length Base36 codes for key identification
- ✅ **JSON Export/Import**: Complete key data with name, private key, and magic code
- ✅ **Automatic Key Generation**: Writer keys automatically create corresponding reader keys
- ✅ **Secure Key Management**: Encrypted storage with password protection
- ✅ **Cross-Platform Compatibility**: Works on any website with text inputs

### Key Pairs

- Each person has a **key pair**: one writer key and one reader key
- The writer key encrypts messages that only the corresponding reader key can decrypt
- Think of it like a mailbox: the writer key is the address (public), the reader key is the key to open it (private)

## 🤝 How to Exchange Keys

### Method 1: Direct Sharing (Recommended)

#### Step 1: Export Your Reader Key

1. **Open Asocial Extension**
   - Click the Asocial icon in your browser
   - Make sure you're in the Key Management panel

2. **Find Your Writer Key**
   - Look in the "Writer Keys" section
   - Find the key you want to share

3. **Copy Reader Key**
   - Click "Copy Reader Key" button next to your writer key
   - This exports a complete JSON with name, private key, and magic code
   - The JSON is copied to your clipboard

4. **Share the JSON**
   - Send the copied JSON to the person you want to communicate with
   - You can share via email, messaging, or any secure method

#### Step 2: They Import Your Key

1. **They Open Their Extension**
   - They click the Asocial icon in their browser
   - Go to the Key Management panel

2. **Add Your Reader Key**
   - In the "Reader Keys" section, click "+ Add Reader Key"
   - Paste the complete JSON you sent them
   - The system automatically extracts name, private key, and magic code
   - Click "Add Key"

3. **Key Added Successfully**
   - Your reader key is now in their reader keys list
   - They can now decrypt messages you send them

#### Step 3: Get Their Reader Key

1. **Ask Them to Export Their Reader Key**
   - They follow the same process as Step 1
   - They send you their complete JSON

2. **Import Their Key**
   - In your extension, go to Reader Keys section
   - Click "+ Add Reader Key" and paste their JSON
   - The system automatically imports with proper name and magic code
   - Click "Add Key"

3. **You Can Now Communicate**
   - You can encrypt messages with their writer key
   - They can decrypt your messages with your reader key
   - Two-way encrypted communication is now possible!

### Method 2: Group Key Sharing

#### For Family/Friends Groups

1. **One Person Creates a Writer Key**
   - Create a writer key with a group name (e.g., "Family Chat")
   - Click "Copy Reader Key" to export the complete JSON

2. **Share with Group Members**
   - Send the JSON to all family/friends
   - Each person imports it as a reader key

3. **Everyone Can Communicate**
   - Anyone in the group can encrypt messages with the shared writer key
   - All group members can decrypt the messages

#### For Work Teams

1. **Team Lead Creates Writer Key**
   - Create a writer key for the team (e.g., "Marketing Team")
   - Export the complete JSON and share with all team members

2. **Team Members Import the Key**
   - Each team member imports the JSON as a reader key
   - Now the whole team can communicate securely

### Method 3: Public Key Sharing

#### For Public Communication

1. **Create a Public Writer Key**
   - Create a writer key with a public name (e.g., "Public Contact")
   - Click "Copy Reader Key" to export the complete JSON

2. **Share Publicly**
   - Post the JSON on your social media
   - Add it to your email signature
   - Include it in your profile

3. **Anyone Can Send You Encrypted Messages**
   - People can import your JSON as a reader key
   - They can then send you encrypted messages
   - Only you can decrypt them with your private reader key

## 🔐 Security Best Practices

### Key Storage

- **Backup Your Keys**: Export your keys and store them safely
- **Use Strong Passwords**: Protect your KeyStore with a strong password
- **Don't Share Private Keys**: Never share your reader keys with anyone
- **Rotate Keys Regularly**: Create new key pairs periodically

### Key Exchange Security

- **Verify Key Sources**: Make sure you're getting keys from the right person
- **Use Secure Channels**: Share keys through encrypted channels when possible
- **Check Key Integrity**: Verify keys haven't been tampered with
- **Revoke Compromised Keys**: If a key is compromised, create a new one

### Communication Security

- **Verify Recipients**: Make sure you're encrypting for the right person
- **Check Message Integrity**: Verify decrypted messages make sense
- **Report Suspicious Activity**: If something seems wrong, investigate
- **Use Multiple Keys**: Don't rely on a single key for all communication

## 🚨 Common Mistakes

### ❌ Don't Do This

- **Don't share your reader key** - This defeats the purpose of encryption
- **Don't use the same key for everything** - Create separate keys for different purposes
- **Don't forget to backup your keys** - You might lose access to encrypted messages
- **Don't share keys over insecure channels** - Use encrypted communication when possible

### ✅ Do This Instead

- **Only share writer keys** - These are safe to share publicly
- **Create separate keys for different groups** - Family, work, friends, etc.
- **Backup your keys regularly** - Store them in a secure location
- **Use secure channels for key exchange** - Encrypted email, secure messaging, etc.

## 🔄 Key Rotation

### When to Rotate Keys

- **Suspected Compromise**: If you think a key might be compromised
- **Regular Intervals**: Every 6-12 months for high-security communication
- **Person Leaves Group**: When someone leaves a group, rotate the group key
- **Security Breach**: If there's a security incident, rotate all keys

### How to Rotate Keys

1. **Create New Key Pair**
   - Generate a new writer/reader key pair
   - Give it a new name (e.g., "Family Chat v2")

2. **Share New Writer Key**
   - Export and share the new writer key
   - Ask everyone to add it to their reader keys

3. **Remove Old Key**
   - Once everyone has the new key, remove the old one
   - Delete the old key from your KeyStore

## 📱 Mobile Considerations

### Cross-Platform Communication

- **Desktop to Mobile**: Keys work across all platforms
- **Mobile Apps**: Keys can be used in mobile browsers
- **Synchronization**: Keys are stored locally, not synced across devices
- **Backup Strategy**: Export keys on each device you use

### Mobile Key Management

- **Export Keys**: Use the same export process on mobile
- **Secure Storage**: Store exported keys in a secure password manager
- **Device Security**: Keep your mobile device secure
- **Regular Backups**: Export keys regularly on mobile devices

## 🎯 Quick Start Checklist

### For New Users

- [ ] Install Asocial extension
- [ ] Create your first KeyStore
- [ ] Create a writer key
- [ ] Export your writer key
- [ ] Share your writer key with someone
- [ ] Get their writer key and add it to your reader keys
- [ ] Test encrypted communication

### For Groups

- [ ] One person creates a group writer key
- [ ] Share the writer key with all group members
- [ ] Each member adds the writer key to their reader keys
- [ ] Test group encrypted communication
- [ ] Set up regular key rotation schedule

### For Public Communication

- [ ] Create a public writer key
- [ ] Share it on your social media/profiles
- [ ] Monitor for encrypted messages
- [ ] Respond with encrypted messages when appropriate

## 🆘 Troubleshooting Key Exchange

### "Key Not Working"

1. **Check Key Format**: Make sure the key is complete and not truncated
2. **Verify Source**: Confirm you got the key from the right person
3. **Try Again**: Sometimes keys need to be re-exported and re-imported
4. **Check Key Type**: Make sure you're using writer keys, not reader keys

### "Can't Decrypt Messages"

1. **Check Reader Keys**: Make sure you have the sender's writer key in your reader keys
2. **Verify Key Name**: Make sure the key name matches the sender
3. **Try Different Key**: The sender might have multiple keys
4. **Contact Sender**: Ask them to verify which key they used

### "Encryption Not Working"

1. **Check Writer Keys**: Make sure you have writer keys available
2. **Verify Recipient**: Make sure you're using the right writer key for the recipient
3. **Test with Simple Message**: Try encrypting a simple test message first
4. **Check Extension**: Make sure the extension is working properly

## 🎉 You're Ready!

With proper key exchange, you can now communicate securely with anyone who has Asocial installed. Remember:

- **Writer keys are for encrypting** (what you send)
- **Reader keys are for decrypting** (what you receive)
- **Only share writer keys** (never reader keys)
- **Keep your KeyStore password safe**
- **Backup your keys regularly**

Happy encrypted communicating! 🔒

