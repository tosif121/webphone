# Force Login Integration Guide

## Overview
The force login flow has been integrated into your application with three modal states:

1. **Login Conflict Modal** - Shown on login when user is already logged in elsewhere
2. **Timer/Waiting Modal** - 5-second countdown after clicking "Force Login"
3. **Security Alert Modal** - Shown on the active device when force login is requested

## How It Works

### On New Device (Login Screen)
1. User enters credentials and clicks Login
2. If API returns `response.message === 'User already login somewhere else'`
3. Login Conflict Modal appears with session duration
4. User clicks "Force Login" → Timer/Waiting Modal shows (5 seconds)
5. After 5 seconds, login attempt is retried

### On Active Device (Layout)
1. When a force login request message is received via JsSIP
2. Security Alert Modal appears automatically
3. DraggableWebPhone is hidden while modal is open
4. User can either:
   - **Allow**: Logs out and redirects to login page
   - **Reject**: Closes modal and continues session

## Message Format

The system listens for messages containing:
- `force_login_request` OR
- `Force Login Request`

Update the message check in `src/hooks/useJssip.js` (line ~686) to match your actual message format.

## Testing

### Method 1: Browser Console
Open browser console and run:
```javascript
window.testForceLogin()
```
This will manually trigger the Security Alert Modal.

### Method 2: Send JsSIP Message
Send a SIP MESSAGE with body containing `force_login_request` or `Force Login Request`.

### Method 3: Simulate API Response
In Login.jsx, temporarily change the condition to test:
```javascript
if (response.message === 'wrong login info') { // Change this temporarily
  setShowLoginConflict(true);
  setIsLoading(false);
  return;
}
```

## Files Modified

1. **src/components/ForceLoginModals.jsx** - Modal components with theme colors
2. **src/components/Login.jsx** - Login Conflict and Timer modals integration
3. **src/components/layout/Layout.jsx** - Security Alert modal integration
4. **src/context/HistoryContext.js** - Added showSecurityAlert state
5. **src/hooks/useJssip.js** - Message listener for force login requests

## Customization

### Change Message Format
Edit `src/hooks/useJssip.js` line ~686:
```javascript
if (message.includes('YOUR_MESSAGE_FORMAT')) {
  window.dispatchEvent(new CustomEvent('forceLoginRequest', { detail: { message } }));
}
```

### Change Session Duration
In Login.jsx, update the state:
```javascript
const [sessionDuration, setSessionDuration] = useState('45 minutes');
```

### Change Timer Duration
In ForceLoginModals.jsx, change the initial countdown:
```javascript
const [countdown, setCountdown] = useState(5); // Change to desired seconds
```

## Troubleshooting

**Issue**: `showSecurityAlert` is always false
- **Solution**: Make sure HistoryProvider is wrapping your app in `_app.js`
- Check that the message format matches what you're checking for in useJssip.js
- Verify the custom event is being dispatched (check console logs)

**Issue**: Modal doesn't appear
- **Solution**: Check browser console for the custom event dispatch
- Verify HistoryContext is imported correctly in Layout.jsx
- Try running `window.testForceLogin()` in browser console to test

**Issue**: DraggableWebPhone still shows
- **Solution**: The condition `shouldShowPhone` checks for `!showSecurityAlert`
- Verify the SecurityAlertContext is providing the correct value

## Backend Integration

To complete the integration, your backend should:

1. When user clicks "Force Login" on new device:
   - Send a SIP MESSAGE to the active session
   - Message body should contain `force_login_request`

2. When active device responds:
   - If "Allow": Terminate the active session
   - If "Reject": Cancel the force login request

3. After 5 seconds timeout:
   - If no response, proceed with force login
   - Terminate the old session automatically
