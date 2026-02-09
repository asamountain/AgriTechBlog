# Crash Detector Testing Guide

## Overview

The enhanced crash detector now provides detailed API failure information including endpoints, status codes, error messages, and smart suggestions for debugging.

## Testing the Enhanced API Failure Detection

### Prerequisites
- Run the app in development mode (`npm run dev`)
- Open browser DevTools (F12)
- Navigate to the Console tab

### Test Scenarios

#### 1. Test 401 Unauthorized Errors

**Steps:**
1. Logout from the application
2. Try to access an admin page or perform an admin action
3. Observe the enhanced notification

**Expected Result:**
- Yellow notification appears in top-right corner
- Shows "API Request Failures (X failed)"
- Lists the failed endpoint with 401 status
- Shows suggestion: "🔐 Authentication issue - Try logging in again"
- Console shows detailed table with failure information

#### 2. Test 404 Not Found Errors

**Steps:**
1. Open browser console
2. Run: `fetch('/api/nonexistent-endpoint').catch(e => console.log(e))`
3. Run it again to trigger the detector (needs 2+ failures)

**Expected Result:**
- Notification shows 404 status
- Shows suggestion: "🔍 Endpoint not found - Check API route configuration"

#### 3. Test 500 Server Errors

**Steps:**
1. Stop MongoDB service or disconnect database
2. Try to fetch blog posts or perform database operations
3. Trigger multiple API calls (navigate between pages)

**Expected Result:**
- Notification shows 500 status codes
- Shows suggestion: "🔥 Server error - Check backend logs and database connection"
- If MongoDB-related: "🗄️ Database issue - Check MongoDB connection"

#### 4. Test Multiple Failures

**Steps:**
1. Create a scenario with multiple failing endpoints
2. Observe the notification showing top 3 failures
3. Check console for complete list

**Expected Result:**
- Notification shows "Recent failures in the last 30 seconds"
- Displays up to 3 failures with full details
- Shows "+ X more failures" if more than 3
- Console table shows all failures

### Console Commands for Testing

#### View Failure History
```javascript
crashDetector.instance.getFailureHistory()
```

#### Generate Health Report
```javascript
crashDetector.instance.generateHealthReport()
```

#### Clear Failure History
```javascript
crashDetector.instance.clearFailureHistory()
```

#### View Recent API Events
```javascript
debugTracker.instance.getRecentEvents(50).filter(e => e.type === 'api_call')
```

## Notification Features

### Visual Elements

1. **Color-Coded Status Badges:**
   - 🔴 Red (500-599): Server errors
   - 🟡 Yellow (400-499): Client errors
   - 🔵 Blue (other): Other status codes

2. **Detailed Information Per Failure:**
   - HTTP method (GET, POST, etc.)
   - Full endpoint URL
   - Status code
   - Error message
   - Time ago (e.g., "5s ago")
   - Request duration (if available)

3. **Smart Suggestions:**
   - Context-aware based on status codes
   - Specific to endpoint types (admin, database, etc.)
   - Actionable debugging steps

4. **Action Buttons:**
   - **View in Console**: Logs full failure details
   - **Copy Details**: Copies JSON to clipboard
   - **Dismiss**: Closes the notification

### Auto-Dismiss
- Notification auto-dismisses after 15 seconds
- Can be manually dismissed anytime
- New failures replace old notifications

## Console Output

When API failures are detected, the console shows:

```
🚨 API Request Failures Detected
┌─────────┬────────────────────────────┬────────┬─────────────────────────┬──────────┬──────────┐
│ Method  │ Endpoint                   │ Status │ Error                   │ Time     │ Duration │
├─────────┼────────────────────────────┼────────┼─────────────────────────┼──────────┼──────────┤
│ POST    │ /api/comments              │ 401    │ Authentication required │ 10:23:45 │ 120ms    │
│ GET     │ /api/blog-posts            │ 500    │ Database error          │ 10:23:47 │ 2500ms   │
└─────────┴────────────────────────────┴────────┴─────────────────────────┴──────────┴──────────┘
```

## Common Failure Patterns

### Authentication Issues (401/403)
**Typical Causes:**
- User not logged in
- Session expired
- Invalid auth token
- Missing permissions

**Suggestions Shown:**
- 🔐 Authentication issue - Try logging in again
- 👤 Admin endpoint - Verify admin authentication

### Server Errors (500+)
**Typical Causes:**
- Database connection lost
- Server crash
- Unhandled exceptions
- Configuration errors

**Suggestions Shown:**
- 🔥 Server error - Check backend logs and database connection
- 🗄️ Database issue - Check MongoDB connection
- ⚠️ Service unavailable - Verify backend server is running

### Client Errors (404)
**Typical Causes:**
- Incorrect endpoint URL
- Route not defined
- Typo in API path

**Suggestions Shown:**
- 🔍 Endpoint not found - Check API route configuration

### Network/CORS Errors
**Typical Causes:**
- CORS misconfiguration
- Network connectivity issues
- Firewall blocking requests

**Suggestions Shown:**
- 🌐 Network/CORS issue - Check backend CORS configuration

## Integration with Debug Tracker

The crash detector works in conjunction with the debug tracker:

1. **Debug tracker** logs all API calls with full details
2. **Crash detector** monitors these logs for patterns
3. **Failures are detected** when 2+ API errors occur within 30 seconds
4. **Enhanced notification** is displayed with extracted details

## QA Workflow

### For Developers
1. See immediate feedback on API failures
2. Click "View in Console" for full error objects
3. Use suggestions to quickly identify root cause
4. Fix the issue and verify resolution

### For QA Team
1. Document failures by clicking "Copy Details"
2. Paste JSON into bug reports
3. Include screenshot of notification
4. Reference specific endpoints and status codes

### For Bug Reports
The "Copy Details" button provides JSON like:
```json
[
  {
    "url": "/api/comments",
    "method": "POST",
    "status": 401,
    "error": "Authentication required",
    "timestamp": 1706097825000,
    "duration": 120
  }
]
```

## Disabling or Customizing

### Disable API Failure Detection
Edit `crash-detector.ts` and remove the `api_failures` pattern from the patterns array.

### Adjust Sensitivity
Change the threshold in the detector:
```typescript
return recentApiErrors.length >= 2; // Change 2 to higher number
```

### Adjust Time Window
Change the time window for detection:
```typescript
Date.now() - e.timestamp < 30000 // Change 30000 (30s) to different value
```

## Production Behavior

**Important:** The crash detector only runs in development mode (`import.meta.env.DEV`).

- ✅ Enabled in development
- ❌ Disabled in production builds
- No performance impact on production
- No notifications shown to end users

## Troubleshooting

### Notification Not Appearing
1. Check if running in dev mode
2. Verify at least 2 API failures occurred within 30 seconds
3. Check browser console for crash detector initialization message
4. Ensure notifications aren't being blocked by browser

### Console Table Not Showing
1. Ensure browser DevTools are open
2. Check Console tab (not Network or other tabs)
3. Look for grouped console output with "🚨 API Request Failures Detected"

### False Positives
If you're getting notifications for expected failures:
1. Adjust the threshold (require more failures)
2. Increase the time window
3. Add specific endpoints to an ignore list (feature can be added)

## Future Enhancements

Potential additions mentioned in the plan:
- Export failure report as JSON file
- Slack/Discord webhook integration for team notifications
- Ignore list for expected failures
- Failure trend analysis over time
