# How to Get Your Figma Credentials

## Getting Your FIGMA_ACCESS_TOKEN

### Step 1: Go to Figma Settings
1. **Open Figma** in your browser: https://www.figma.com
2. **Sign in** to your Figma account
3. **Click your profile picture** (top right corner)
4. **Select "Settings"** from the dropdown menu

### Step 2: Navigate to Personal Access Tokens
1. In the left sidebar, click **"Personal access tokens"**
2. You'll see a section titled **"Personal access tokens"**

### Step 3: Create a New Token
1. **Click "Create new token"** or **"Generate new token"**
2. **Enter a description** (e.g., "AgriTech Blog Integration")
3. **Set expiration** (choose "No expiration" or set a long period)
4. **Click "Create token"**

### Step 4: Copy Your Token
1. **Copy the generated token** immediately (it won't show again!)
2. The token looks like: `figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **Save it securely** - you'll need it for your `.env` file

## Getting Your FIGMA_FILE_KEY

### Method 1: From Figma File URL

1. **Open your Figma design file** in browser or desktop app
2. **Look at the URL** in your browser address bar
3. **Find the file key** in this pattern:

```
https://www.figma.com/file/[FILE_KEY]/[FILE_NAME]
                           ^^^^^^^^
                        This is your file key
```

### Example URL Breakdown:
```
https://www.figma.com/file/ABC123def456GHI789/My-AgriTech-Design
                           ^^^^^^^^^^^^^^^^^^
                           This is your FIGMA_FILE_KEY
```

### Method 2: From Figma Share Link

1. **Click "Share"** button in your Figma file (top right)
2. **Copy the link** 
3. **Extract the file key** from the copied URL using the same pattern above

### Method 3: From Figma Desktop App

1. **Open your file** in Figma desktop app
2. **Go to File → Copy Link** or press `Cmd+L` (Mac) / `Ctrl+L` (Windows)
3. **Extract the file key** from the copied URL

## Setting Up Your Environment

### Add to .env File

Once you have both credentials:

```bash
# Navigate to your project root
cd /Users/test/Coding/AgriTechBlog

# Add your credentials to .env file
echo "FIGMA_ACCESS_TOKEN=figd_your_actual_token_here" >> .env
echo "FIGMA_FILE_KEY=your_actual_file_key_here" >> .env
```

### Example .env Content:
```bash
# Figma Integration
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=ABC123def456GHI789

# Your other environment variables...
```

## Security Best Practices

### 🔒 Keep Your Token Secure
- ✅ **Never commit** `.env` to Git (already in `.gitignore`)
- ✅ **Don't share** your token publicly
- ✅ **Regenerate** if compromised
- ✅ **Set expiration** for added security

### 🔄 Token Management
- **Backup your token** in a secure password manager
- **Document which projects** use each token
- **Rotate tokens** periodically for security

## Common File Key Patterns

Your `FIGMA_FILE_KEY` will be one of these patterns:

```bash
# Standard file key (most common)
ABC123def456GHI789

# Longer format
ABC123def456GHI789jklMNO012

# With numbers and letters
1A2B3C4d5e6F7g8H9i0J
```

## Verification

### Test Your Credentials

Once you've added your credentials to `.env`:

```bash
# Test the connection
bun run figma:init

# If successful, you'll see:
# ✅ Figma integration initialized!

# If there's an issue, you'll see specific error messages
```

## Troubleshooting

### ❌ "Invalid token" Error
- **Regenerate your token** in Figma settings
- **Check for extra spaces** in your `.env` file
- **Ensure token starts** with `figd_`

### ❌ "File not found" Error  
- **Verify file key** format (no dashes, slashes, or spaces)
- **Check file permissions** (you need view access minimum)
- **Try with a different file** to isolate the issue

### ❌ "Permission denied" Error
- **Request access** to the Figma file from the owner
- **Check if file is public** or private
- **Verify you're logged into** the correct Figma account

## Quick Setup Commands

### One-liner setup (replace with your actual values):
```bash
echo "FIGMA_ACCESS_TOKEN=figd_your_token_here" >> .env && \
echo "FIGMA_FILE_KEY=your_file_key_here" >> .env && \
bun run figma:init
```

## Next Steps

After setting up your credentials:

1. **Test connection**: `bun run figma:init`
2. **Sync design tokens**: `bun run figma:sync`
3. **Start development**: `bun run dev:figma`
4. **Check generated files**: `client/src/styles/figma-tokens.css`

---

**Need help?** The credentials are specific to your Figma account and files. If you're having trouble, double-check the URL format and token generation steps above. 