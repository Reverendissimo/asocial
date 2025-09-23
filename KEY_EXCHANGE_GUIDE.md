# How Contacts Know Which Key to Use

## The Problem You Identified

You're absolutely right! This is a critical question: **How does a contact know which key to use to decrypt your message?**

## The Solution: Key ID-Based Direct Matching

### **How It Works:**

1. **You encrypt a message** for a specific group (e.g., "Family")
2. **The encrypted message contains** a unique `keyId` in the tag: `[ASOCIAL ABC12345]`
3. **Your contact's extension** looks up the key by ID
4. **Direct key matching** - no need to try all keys!

### **Step-by-Step Process:**

#### **When You Encrypt:**
```
1. You select "Family" group (keyId: "ABC12345")
2. Extension gets the "Family" group's private key
3. Message is encrypted with that key
4. Message becomes: [ASOCIAL ABC12345] eyJ2ZXJzaW9uIjoiMS4wIiwiZ3JvdXBJZCI6Imdyb3VwX2ZhbWlseV8xMjM0NSJ9...
```

#### **When Contact Decrypts:**
```
1. Contact sees: [ASOCIAL ABC12345] eyJ2ZXJzaW9uIjoiMS4wIiwiZ3JvdXBJZCI6Imdyb3VwX2ZhbWlseV8xMjM0NSJ9...
2. Extension extracts keyId: "ABC12345"
3. Extension looks up key by ID:
   - Finds "ABC12345" → SUCCESS! ✅
   - If not found → "Cannot decrypt - missing key"
4. Message is decrypted and displayed
```

## **Key Exchange Process**

### **For You (The Sender):**
1. **Create encryption groups** (Family, Work, Close Friends)
2. **Share your public keys** with contacts:
   - Export public key for "Family" group
   - Send to family members via QR code, file, or copy/paste
3. **Encrypt messages** by selecting the appropriate group

### **For Your Contacts:**
1. **Import your public keys** into their extension
2. **Assign keys to groups** in their extension
3. **Extension automatically tries** all keys when decrypting

## **Example Scenario**

### **You want to send a family message:**

1. **You write:** "Happy birthday Mom! 🎂"
2. **You click "Be Asocial"** and select "Family" group (keyId: "ABC12345")
3. **Message becomes:** `[ASOCIAL ABC12345] eyJ2ZXJzaW9uIjoiMS4wIiwiZ3JvdXBJZCI6Imdyb3VwX2ZhbWlseV8xMjM0NSIsImVuY3J5cHRlZERhdGEiOiIuLi4ifQ==`
4. **You post it** on LinkedIn

### **Your family members see it:**

1. **Mom's extension** detects the encrypted message
2. **Extension extracts keyId:** "ABC12345"
3. **Extension looks up key by ID:**
   - Finds "ABC12345" → SUCCESS! ✅
4. **Mom sees:** "Happy birthday Mom! 🎂" (decrypted)
5. **Shows:** "🔒 Decrypted Message from Family group"

### **Your work colleagues see it:**

1. **Colleague's extension** detects the encrypted message
2. **Extension extracts keyId:** "ABC12345"
3. **Extension looks up key by ID:**
   - Doesn't find "ABC12345" → "Cannot decrypt (missing key)"
4. **Colleague sees:** "🔒 Encrypted Message - Cannot decrypt (missing key)"

## **Key Management Architecture**

### **Your Setup:**
- **You have multiple private keys** (one per group)
- **You share different public keys** with different people
- **Family gets your "Family" public key**
- **Work colleagues get your "Work" public key**

### **Contact's Setup:**
- **Each contact imports your public keys**
- **They assign keys to groups** in their extension
- **Extension automatically matches** keys to messages

## **Visual Example**

```
Your Groups:                    Contact's Imported Keys:
┌─────────────────┐            ┌─────────────────────┐
│ Family Group    │            │ Your Family Key    │
│ - Private Key   │            │ - Public Key       │
│ - Public Key    │ ──────────→│ - Assigned to      │
└─────────────────┘            │   "Your Family"    │
                               └─────────────────────┘
┌─────────────────┐            ┌─────────────────────┐
│ Work Group      │            │ Your Work Key       │
│ - Private Key   │            │ - Public Key       │
│ - Public Key    │ ──────────→│ - Assigned to      │
└─────────────────┘            │   "Your Work"      │
                               └─────────────────────┘
```

## **Why This Works**

1. **Direct Key Lookup:** Extension finds the exact key by ID
2. **Fast Decryption:** No need to try multiple keys
3. **Clear Error Messages:** "Missing key ABC12345" vs generic "cannot decrypt"
4. **User-Friendly:** Contacts don't need to know which key to use
5. **Efficient:** O(1) key lookup instead of O(n) key trying

## **Security Benefits**

- **Only intended recipients** can decrypt (they have the right key)
- **Automatic key rotation** (change keys, old messages become undecryptable)
- **Group isolation** (Family can't decrypt Work messages)
- **Forward secrecy** (if key is compromised, only future messages are affected)

This architecture ensures that contacts automatically get the right decryption key without any manual intervention!
