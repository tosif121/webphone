# Backend Requirements for Force Login Feature

## Overview
This document outlines the backend requirements to implement the Force Login feature for the Agent Panel.

---

## 1. Login API Modification

### Endpoint: `POST /userlogin/{username}`

**Current Response (when user already logged in):**
```json
{
  "message": "User already login somewhere else",
  "userData": null
}
```

**New Required Response (when user already logged in):**
```json
{
  "message": "User already login somewhere else",
  "sessionInfo": {
    "sessionId": "unique-session-id-123",
    "loginTime": "2024-12-04T10:30:00Z",
    "duration": "45 minutes",
    "deviceInfo": "Chrome on Windows",
    "ipAddress": "192.168.1.100"
  },
  "userData": null
}
```

**Fields Explanation:**
- `sessionId`: Unique identifier for the active session (required for force logout)
- `loginTime`: When the user logged in (ISO 8601 format)
- `duration`: Human-readable session duration (e.g., "45 minutes", "2 hours")
- `deviceInfo`: Browser and OS information (optional)
- `ipAddress`: IP address of active session (optional)

---

## 2. Force Login API

### New Endpoint: `POST /force-login`

**Purpose:** Request to force logout the active session and allow new login

**Request Body:**
```json
{
  "username": "agent123",
  "password": "encrypted_password",
  "sessionId": "unique-session-id-123",
  "requestType": "force_login"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Force login request sent to active session",
  "consentRequired": true,
  "timeout": 5000
}
```

**Response Fields:**
- `success`: Boolean indicating if request was sent
- `message`: Status message
- `consentRequired`: If true, wait for user consent from active device
- `timeout`: Milliseconds to wait for consent (5000ms = 5 seconds)

**After Timeout (if no response):**
- Automatically terminate the old session
- Allow new login to proceed
- Return normal login success response

---

## 3. SIP MESSAGE Integration (JsSIP)

### Send Force Login Request to Active Device

**When:** After receiving force login request from new device

**Action:** Send SIP MESSAGE to the active user's SIP endpoint

**Message Format:**
```
To: sip:agent123@yourdomain.com
From: sip:system@yourdomain.com
Content-Type: text/plain

force_login_request
```

**Message Body Options (choose one):**
- Simple: `force_login_request`
- Detailed: `Force Login Request`
- JSON format:
```json
{
  "type": "force_login_request",
  "requestedBy": "192.168.1.200",
  "timestamp": "2024-12-04T10:35:00Z"
}
```

**Important:** The frontend is currently checking for messages containing:
- `force_login_request` OR
- `Force Login Request`

You can use either format, or we can adjust the frontend to match your format.

---

## 4. Consent Response API

### New Endpoint: `POST /force-login/consent`

**Purpose:** Handle user's response from active device

**Request Body (User Allows):**
```json
{
  "username": "agent123",
  "sessionId": "unique-session-id-123",
  "consent": "allow",
  "timestamp": "2024-12-04T10:35:05Z"
}
```

**Request Body (User Rejects):**
```json
{
  "username": "agent123",
  "sessionId": "unique-session-id-123",
  "consent": "reject",
  "timestamp": "2024-12-04T10:35:05Z"
}
```

**Response (Allow):**
```json
{
  "success": true,
  "message": "Session terminated. New login allowed.",
  "action": "logout"
}
```

**Response (Reject):**
```json
{
  "success": true,
  "message": "Force login request rejected.",
  "action": "continue"
}
```

---

## 5. Session Management

### Requirements:

1. **Track Active Sessions:**
   - Store session ID, username, login time, device info
   - One active session per user (or track multiple if needed)

2. **Session Termination:**
   - When force login is allowed, immediately terminate old session
   - Clear session tokens/cookies
   - Send logout notification to old device (optional)

3. **Session Timeout:**
   - If no consent response within 5 seconds, auto-terminate old session
   - Allow new login to proceed

---

## 6. Complete Flow Diagram

```
NEW DEVICE                    BACKEND                    ACTIVE DEVICE
    |                            |                            |
    |---(1) Login Request------->|                            |
    |    (username, password)    |                            |
    |                            |                            |
    |<--(2) Already Logged In----|                            |
    |    (with session info)     |                            |
    |                            |                            |
    |---(3) Force Login Req----->|                            |
    |    (with sessionId)        |                            |
    |                            |                            |
    |                            |---(4) SIP MESSAGE--------->|
    |                            |    "force_login_request"   |
    |                            |                            |
    |                            |                            |---(5) User Sees Alert
    |                            |                            |
    |                            |<--(6) Consent Response-----|
    |                            |    (allow/reject)          |
    |                            |                            |
    |                            |                            |
    |<--(7) Login Success--------|---(8) Logout Notification->|
    |    (if allowed)            |    (if allowed)            |
    |                            |                            |
```

**Step-by-Step:**

1. **New device** sends login request
2. **Backend** responds: "User already login somewhere else" + session info
3. **New device** user clicks "Force Login" → sends force login request
4. **Backend** sends SIP MESSAGE to active device: `"force_login_request"`
5. **Active device** shows Security Alert modal
6. **Active device** user responds (allow/reject) → sends consent response
7. **Backend** processes consent:
   - If **allow**: Terminate old session, allow new login
   - If **reject**: Keep old session, deny new login
8. **Backend** notifies devices of the result

**Timeout Handling:**
- If no response within 5 seconds → auto-terminate old session → allow new login

---

## 7. API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/userlogin/{username}` | POST | Login (modified to return session info) |
| `/force-login` | POST | Request force login |
| `/force-login/consent` | POST | Handle consent response |

---

## 8. Database Schema (Suggested)

### Table: `active_sessions`

```sql
CREATE TABLE active_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  login_time TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  sip_endpoint VARCHAR(255),
  token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);
```

### Table: `force_login_requests` (Optional - for tracking)

```sql
CREATE TABLE force_login_requests (
  request_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  old_session_id VARCHAR(255),
  new_ip_address VARCHAR(45),
  request_time TIMESTAMP NOT NULL,
  consent_response ENUM('allow', 'reject', 'timeout'),
  response_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Security Considerations

1. **Validate Force Login Requests:**
   - Verify username and password before sending force login request
   - Prevent brute force attacks (rate limiting)

2. **Session Security:**
   - Use secure session tokens
   - Encrypt sensitive data
   - Implement HTTPS only

3. **Notification:**
   - Log all force login attempts
   - Send email/SMS notification to user (optional)
   - Track suspicious activity

---

## 10. Testing Checklist

- [ ] Login API returns session info when user already logged in
- [ ] Force login request sends SIP MESSAGE to active device
- [ ] Active device receives SIP MESSAGE correctly
- [ ] Consent "allow" terminates old session and allows new login
- [ ] Consent "reject" keeps old session and denies new login
- [ ] Timeout (5 seconds) auto-terminates old session
- [ ] Multiple force login requests are handled correctly
- [ ] Session data is cleaned up properly

---

## 11. Frontend Integration Points

### What Frontend Sends:

1. **Login Request:**
   ```javascript
   POST https://esamwad.iotcom.io/userlogin/${username}
   Body: { username, password }
   ```

2. **Force Login Request:**
   ```javascript
   POST https://esamwad.iotcom.io/force-login
   Body: { username, password, sessionId, requestType: 'force_login' }
   ```

3. **Consent Response:**
   ```javascript
   POST https://esamwad.iotcom.io/force-login/consent
   Body: { username, sessionId, consent: 'allow' | 'reject', timestamp }
   ```

### What Frontend Expects:

1. **Session Info in Login Response:**
   - `sessionInfo.duration` → displayed in Login Conflict modal

2. **SIP MESSAGE:**
   - Message body containing `force_login_request` or `Force Login Request`
   - Frontend listens via JsSIP `newMessage` event

3. **Consent Response:**
   - Success/failure status
   - Action to take (logout/continue)

---

## 12. Configuration

### Environment Variables (Backend):

```env
# Force Login Settings
FORCE_LOGIN_TIMEOUT=5000          # Milliseconds to wait for consent
FORCE_LOGIN_ENABLED=true          # Enable/disable feature
SIP_MESSAGE_ENDPOINT=sip:system@yourdomain.com

# Session Settings
MAX_SESSION_DURATION=28800000     # 8 hours in milliseconds
SESSION_CLEANUP_INTERVAL=3600000  # 1 hour in milliseconds
```

---

## 13. Error Handling

### Possible Errors:

1. **Invalid Session ID:**
   ```json
   {
     "success": false,
     "error": "Invalid session ID",
     "code": "INVALID_SESSION"
   }
   ```

2. **User Not Found:**
   ```json
   {
     "success": false,
     "error": "User not found",
     "code": "USER_NOT_FOUND"
   }
   ```

3. **SIP MESSAGE Failed:**
   ```json
   {
     "success": false,
     "error": "Failed to send notification to active device",
     "code": "SIP_MESSAGE_FAILED"
   }
   ```

4. **Timeout:**
   ```json
   {
     "success": true,
     "message": "No response from active device. Session terminated.",
     "code": "CONSENT_TIMEOUT"
   }
   ```

---

## 14. Questions for Backend Developer

1. **Current Session Management:**
   - How are active sessions currently tracked?
   - Do you store session IDs in database or cache (Redis)?

2. **SIP Integration:**
   - Do you have existing SIP MESSAGE sending capability?
   - What SIP library/service are you using?

3. **Authentication:**
   - Should force login require password re-entry?
   - Any additional security checks needed?

4. **Notification:**
   - Should we send email/SMS when force login occurs?
   - Any logging requirements?

5. **Timeline:**
   - When can these endpoints be ready?
   - Any blockers or dependencies?

---

## 15. Contact & Support

**Frontend Developer:** [Your Name]
**Backend Developer:** [Backend Dev Name]

**Frontend is ready and waiting for:**
1. Session info in login response
2. Force login API endpoint
3. SIP MESSAGE with `force_login_request`
4. Consent response API endpoint

**Frontend can be tested with:**
- `window.testForceLogin()` in browser console
- Temporary API response modifications

---

## Next Steps

1. Backend dev reviews this document
2. Confirm API endpoint URLs and formats
3. Implement backend changes
4. Test with frontend integration
5. Deploy to staging environment
6. Final testing and production deployment
