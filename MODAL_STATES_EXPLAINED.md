# Force Login Modal States Explained

## Two Different Scenarios

### Scenario 1: NEW DEVICE (Login Screen)
**User is trying to login on a new device**

States used:
- `showLoginConflict` (local state in Login.jsx)
- `showTimerWaiting` (local state in Login.jsx)

Flow:
1. User enters credentials → clicks Login
2. API returns: `"User already login somewhere else"`
3. **Login Conflict Modal** appears (`showLoginConflict = true`)
4. User clicks "Force Login"
5. **Timer/Waiting Modal** appears (`showTimerWaiting = true`)
6. After 5 seconds, login is retried

---

### Scenario 2: ACTIVE DEVICE (Layout/Dashboard)
**User is already logged in and someone tries to force login**

State used:
- `showSecurityAlert` (from HistoryContext - shared globally)

Flow:
1. User is working normally
2. JsSIP receives message: `"force_login_request"`
3. **Security Alert Modal** appears (`showSecurityAlert = true`)
4. **DraggableWebPhone is hidden** automatically
5. User clicks "Yes, Logout & Allow" → logs out
6. OR User clicks "No, Reject Request" → continues session

---

## Why Different States?

### `showLoginConflict` & `showTimerWaiting` (Local)
- Only used in Login.jsx
- Not shared with other components
- Resets when Login component unmounts
- Controls modals on the login screen

### `showSecurityAlert` (Global - HistoryContext)
- Shared across ALL components
- Persists during the session
- Controls Security Alert modal in Layout
- Also controls DraggableWebPhone visibility

---

## Console Logs to Watch

### In Login.jsx:
```
"showSecurityAlert in Login: false"  // Initial state
"User already logged in elsewhere - showing Login Conflict modal"
"Login Modal States: { showLoginConflict: true, showTimerWaiting: false, showSecurityAlert: false }"
"Force Login clicked - closing Login Conflict modal, showing Timer modal"
"Login Modal States: { showLoginConflict: false, showTimerWaiting: true, showSecurityAlert: false }"
"Timer completed - closing Timer modal, retrying login"
```

### In Layout.jsx:
```
"setShowSecurityAlert false"  // Initial state
"Message event: jai Bhole baba, 1764850758507"  // Regular keepalive messages
"Force login request detected in message"  // When force login message received
"Force login request received in Layout: { message: 'force_login_request' }"
"setShowSecurityAlert true"  // Security Alert modal appears
```

### In useJssip.js:
```
"Message event: force_login_request"  // When message is received
"Force login request detected in message"  // When message matches pattern
```

---

## Testing Each Scenario

### Test Scenario 1 (Login Conflict):
1. Temporarily modify Login.jsx line ~217:
   ```javascript
   if (response.message === 'wrong login info') {
     console.log('User already logged in elsewhere - showing Login Conflict modal');
     setShowLoginConflict(true);
     setIsLoading(false);
     return;
   }
   ```
2. Try to login with wrong credentials
3. Watch console logs
4. Login Conflict modal should appear

### Test Scenario 2 (Security Alert):
1. Login to your app
2. Open browser console
3. Run: `window.testForceLogin()`
4. Watch console logs
5. Security Alert modal should appear
6. DraggableWebPhone should hide

---

## Current Issue: showSecurityAlert Always False?

If you're seeing `showSecurityAlert: false` in Login.jsx, that's **CORRECT**!

**Why?**
- `showSecurityAlert` is only set to `true` in Layout.jsx (when active device receives force login request)
- In Login.jsx, it should always be `false` because:
  - User is not logged in yet
  - They're on the login screen
  - Security Alert is for ACTIVE sessions only

**The Login screen uses different states:**
- `showLoginConflict` for Login Conflict modal
- `showTimerWaiting` for Timer modal

---

## Summary

| Modal | State | Where | When |
|-------|-------|-------|------|
| Login Conflict | `showLoginConflict` | Login.jsx | New device trying to login |
| Timer/Waiting | `showTimerWaiting` | Login.jsx | After clicking "Force Login" |
| Security Alert | `showSecurityAlert` | Layout.jsx | Active device receives force login request |

All three modals are **independent** and serve different purposes!
