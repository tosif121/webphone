# How to Test Force Login Flow

## Quick Test (Browser Console)

1. Login to your application
2. Open browser console (F12)
3. Run this command:
   ```javascript
   window.testForceLogin()
   ```
4. The Security Alert modal should appear
5. DraggableWebPhone should be hidden
6. Click "Yes, Logout & Allow" to test logout flow
7. Or click "No, Reject Request" to dismiss

## Test with JsSIP Message

To test the actual message flow, your backend needs to send a SIP MESSAGE with body containing:
- `force_login_request` OR
- `Force Login Request`

Example using JsSIP (from another session):
```javascript
// Send a test message
ua.sendMessage('sip:user@domain.com', 'force_login_request');
```

## Test Login Conflict Modal

1. Temporarily modify Login.jsx to trigger the modal:
   ```javascript
   // In Login.jsx, around line 200, change:
   if (response.message === 'wrong login info') {
     setShowLoginConflict(true);  // Add this line
     toast.error('Incorrect username or password');
     setIsLoading(false);
     return;
   }
   ```

2. Try to login with wrong credentials
3. Login Conflict modal should appear
4. Click "Force Login" to see Timer modal (5 seconds)

## Expected Behavior

### On New Device (Login Screen):
1. ✅ Login Conflict Modal appears
2. ✅ Shows session duration (45 minutes)
3. ✅ "Cancel" button closes modal
4. ✅ "Force Login" button shows Timer modal
5. ✅ Timer counts down from 5 to 0
6. ✅ After 5 seconds, login is retried

### On Active Device (Layout):
1. ✅ Security Alert Modal appears
2. ✅ DraggableWebPhone is hidden
3. ✅ Toast notification shows
4. ✅ "Yes, Logout & Allow" logs out and redirects to login
5. ✅ "No, Reject Request" closes modal and continues session

## Debugging

Check browser console for these logs:
- `"Message event:"` - Shows all incoming JsSIP messages
- `"Force login request detected in message"` - Confirms message was recognized
- `"Force login request received in Layout:"` - Confirms event was received
- `"Testing force login alert..."` - When using window.testForceLogin()

## Current State

The `showSecurityAlert` state is stored in **HistoryContext** and is:
- ✅ Shared across all components
- ✅ Persists during the session
- ✅ Resets on page reload
- ✅ Controls DraggableWebPhone visibility

## Next Steps

1. Update your backend to send the force login message
2. Adjust the message format check in `src/hooks/useJssip.js` if needed
3. Test the full flow with two devices/browsers
4. Customize the session duration display if needed
