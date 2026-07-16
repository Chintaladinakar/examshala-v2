# OTP Implementation Guide

One-Time Password (OTP) has been implemented for:
1. **Signup Email Verification**
2. **Password Reset Verification**

## OTP Specifications

- **Format:** 6 alphanumeric characters (A-Z, 0-9)
- **Expiry:** 5 minutes
- **Max Attempts:** 5 wrong attempts
- **Block Duration:** 12 hours after max attempts exceeded

## API Endpoints

### 1. Request Signup OTP

**Endpoint:** `POST /api/auth/request-signup-otp`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "expiresIn": 300
  }
}
```

**Response (Error - Blocked):**
```json
{
  "success": false,
  "code": "OTP_BLOCKED",
  "message": "Too many failed attempts. Please try again after 12:45 PM"
}
```

---

### 2. Verify Signup OTP

**Endpoint:** `POST /api/auth/verify-signup-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "AB12CD"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "code": "INVALID_OTP",
  "message": "Invalid OTP. 4 attempts remaining."
}
```

---

### 3. Request Password Reset OTP

**Endpoint:** `POST /api/auth/request-password-reset-otp`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email for password reset",
  "data": {
    "expiresIn": 300
  }
}
```

---

### 4. Verify Password Reset OTP

**Endpoint:** `POST /api/auth/verify-password-reset-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "AB12CD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified. You can now reset your password."
}
```

---

## Frontend Integration

### Signup with OTP Flow

```typescript
// Step 1: Request OTP
const response = await fetch('http://localhost:5000/api/auth/request-signup-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Step 2: User enters OTP from email
// Step 3: Verify OTP
const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-signup-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    otp: 'AB12CD' 
  })
});

// Step 4: Proceed with signup
const signupResponse = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
});
```

### Password Reset with OTP Flow

```typescript
// Step 1: Request reset OTP
const response = await fetch('http://localhost:5000/api/auth/request-password-reset-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Step 2: User enters OTP from email
// Step 3: Verify OTP
const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-password-reset-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: 'AB12CD'
  })
});

// Step 4: Reset password (only after OTP is verified)
// You can either:
// - Require user to set new password immediately
// - Or generate a temporary token and send via email
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_OTP` | 400 | OTP code is incorrect |
| `OTP_EXPIRED` | 400 | OTP has expired (5 minutes passed) |
| `OTP_BLOCKED` | 429 | Too many failed attempts, blocked for 12 hours |
| `OTP_NOT_FOUND` | 400 | No OTP generated for this email |
| `INVALID_OTP_TYPE` | 400 | OTP is for different operation (e.g., signup vs password reset) |
| `MISSING_FIELDS` | 400 | Email or OTP not provided |

---

## Testing

### Test Signup OTP
```bash
curl -X POST http://localhost:5000/api/auth/request-signup-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"dinakar.eon@gmail.com"}'
```

### Test Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-signup-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"dinakar.eon@gmail.com","otp":"AB12CD"}'
```

---

## Security Features

✅ **Rate Limiting:** Max 5 attempts, then 12-hour block
✅ **Time-based Expiry:** OTPs expire after 5 minutes
✅ **Secure Generation:** Cryptographically random alphanumeric codes
✅ **Email Verification:** Sent via Gmail SMTP
✅ **OTP Type Validation:** Can't use signup OTP for password reset
✅ **Email Uniqueness:** One OTP per email address at a time

---

## Next Steps

1. **Update Frontend** - Integrate OTP verification in signup and password reset flows
2. **Email Styling** - Customize OTP email templates if needed
3. **User Experience** - Add countdown timer (5 mins) on frontend
4. **Notifications** - Add in-app notifications when OTP expires

