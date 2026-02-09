# 🔥 Firestore Security Rules Setup

## **🚨 Current Error**
```
FirebaseError: Missing or insufficient permissions.
```

This error occurs because the Firestore security rules are blocking user profile creation.

## **🔧 Quick Fix: Test Mode Rules**

### **Step 1: Go to Firebase Console**
1. Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** → **"Rules"** tab

### **Step 2: Replace Rules with Test Mode**
Replace the current rules with this **temporary test mode** configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes (TESTING ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### **Step 3: Publish Rules**
Click **"Publish"** to save the rules.

## **⚠️ Important: Test Mode is NOT for Production**

The above rules allow **anyone** to read/write to your database. This is only for testing.

## **🛡️ Production Security Rules (Use Later)**

Once everything works, replace with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - readable by all, writable by owner
    match /userProfiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Comments - readable by all, writable by authenticated users
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## **🎯 What to Do Now**

1. **Use test mode rules** to get comments working
2. **Test the system** thoroughly
3. **Switch to production rules** before deploying to production

## **🔍 Why This Happened**

The original security rules were too restrictive and didn't allow:
- Creating new user profiles
- Writing comments
- Reading user data

Test mode temporarily removes all restrictions so you can verify the system works.
