# InviteFlow Server

InviteFlow is a platform for creating and managing invitations for weddings, birthdays, engagements, housewarming ceremonies, corporate events, and more. This repository contains the backend API built with Express.js and MongoDB.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Redis (Future)
- BullMQ (Future)
- Cloudinary (Future)

---

## Project Structure

```
apps/
└── server/
    ├── src/
    │   ├── config/
    │   ├── middleware/
    │   ├── models/
    │   ├── modules/
    │   │   ├── auth/
    │   │   ├── events/
    │   │   ├── event-types/
    │   │   └── users/
    │   ├── routes/
    │   ├── utils/
    │   ├── app.js
    │   └── server.js
    │
    └── seeds/
```

---

## Installation

Clone the repository.

```bash
git clone https://github.com/midhunmadhavps/InviteFlow.git
```

Install dependencies.

```bash
npm install
```

---

## Environment Variables

Create a `.env` file.

```env
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=27017
DB_NAME=inviteflow

JWT_SECRET=my_super_secret_key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8081

# WhatsApp Cloud API environment fallback (web configuration can be saved in MongoDB)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id
# Optional; configure when receiving and verifying WhatsApp webhooks
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
# Optional dedicated encryption key for WhatsApp credentials saved in MongoDB
WHATSAPP_CONFIG_ENCRYPTION_KEY=use-a-stable-random-secret-at-least-32-characters
WHATSAPP_API_VERSION=v22.0
API_PUBLIC_URL=https://your-public-api.example.com
```

`API_PUBLIC_URL` must be reachable by WhatsApp so it can download uploaded event and host images. WhatsApp only allows free-form messages during an open customer service window; initiating a conversation outside that window requires an approved WhatsApp message template.
The admin WhatsApp configuration page reports whether the access and webhook verify tokens are configured and allows administrators to edit the four values. The webhook verify token is optional when sending messages. Saved values are stored in the MongoDB `whatsapp_config` collection and take precedence over matching environment variables; environment values remain the fallback when a database value is not set. Access and verify tokens are encrypted before storage and are write-only in the web app. Configure a stable `WHATSAPP_CONFIG_ENCRYPTION_KEY` and keep it backed up securely; if it is omitted, the server uses `JWT_SECRET` for encryption. Losing or changing the encryption key prevents the server from decrypting saved tokens. Keep database access restricted and protect database backups.

### Event payment approval for invite scheduling

The Schedule Invite action requires a payment document for the same event and user with `status: "Approved"`. Payment documents use the MongoDB `payments` collection with `eventId`, `userId`, and a status of `Pending`, `Approved`, or `Rejected`. Razorpay payments are approved after provider verification; QR/manual payment approval remains admin-managed.
The admin Payment page has a gateway enable switch stored in the `payment_gateway_config` collection. The Make Payment button is always available when payment is required. When Razorpay is enabled as the primary provider, the mobile gateway screen opens its hosted payment link; other provider choices and the shared UPI QR remain available as configured. When the gateway is disabled, the app opens a QR-only payment screen. QR/manual payment approval remains admin-managed.

When Razorpay is enabled and selected as the primary provider, the mobile payment screen creates a Razorpay Payment Link using the price configured for the event type. The app marks the payment approved only after checking the payment link status with Razorpay or validating a signed webhook. Configure the Razorpay webhook URL as `https://<your-api-host>/api/event/payments/razorpay/webhook` and subscribe to `payment_link.paid`; use the same webhook secret saved in admin settings.

Admins can set INR prices for active event types in the Event Type Pricing section of the Payment page. Prices must be greater than zero and support up to two decimal places. Razorpay payment links use INR; event price values are stored with the event type records.

The admin Payment page also accepts these provider credentials. They may alternatively be supplied through the server environment:

```env
# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# PhonePe
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_WEBHOOK_USERNAME=your_webhook_username
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_ENVIRONMENT=sandbox
```

Provider secrets saved from the admin page are encrypted in `payment_gateway_config`; secret values are never returned to the browser. Administrators can enable Razorpay, PhonePe, and PayPal separately and select one enabled provider as primary. PayPal can be configured for Sandbox or Live mode. Keep the stable `WHATSAPP_CONFIG_ENCRYPTION_KEY` (or `JWT_SECRET` fallback) unchanged so stored secrets remain decryptable. Razorpay checkout is implemented using payment links; PhonePe and PayPal remain configuration-only until their checkout and webhook flows are implemented.

---

## Start Development Server

```bash
npm run seed
npm run server
```

Production

```bash
npm start
```

---

## Authentication Flow

### Register

```
POST /api/auth/register
```

Request

```json
{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "9876543210",
    "email": "john@example.com"
}
```

---

### Verify OTP

```
POST /api/auth/verify-otp
```

Request

```json
{
    "phone": "9876543210",
    "otp": "123456"
}
```

---

### Resend OTP

```
POST /api/auth/resend-otp
```

Request

```json
{
    "phone": "9876543210"
}
```

---

### Set Password

```
POST /api/auth/set-password
```

Request

```json
{
    "userId": "68952fxxxxxxxxxxxx",
    "username": "midhun",
    "password": "Welcome@123",
    "confirmPassword": "Welcome@123"
}
```

---

### Login

```
POST /api/auth/login
```

Request

```json
{
    "username": "midhun",
    "password": "Welcome@123"
}
```

---

## Forgot Password

Allows a registered user to request an OTP to reset their password.

**POST**

```
/api/auth/forgot-password
```

### Request

```json
{
    "username": "midhun"
}
```

### Response

```json
{
    "success": true,
    "message": "OTP sent successfully.",
    "data": {
        "phone": "9876543210"
    }
}
```
## Reset Password

Allows the user to create a new password after successful OTP verification.

**POST**

```
/api/auth/reset-password
```

### Request

```json
{
    "userId": "6895xxxxxxxxxxxx",
    "password": "NewPassword@123",
    "confirmPassword": "NewPassword@123"
}
```

### Response

```json
{
    "success": true,
    "message": "Password reset successfully.",
    "data": {
        "userId": "6895xxxxxxxxxxxx"
    }
}
```


### Profile

```
GET /api/auth/profile
```

Header

```
Authorization: Bearer <JWT_TOKEN>
```

---

## User Registration Flow

```
Register
      │
      ▼
Generate OTP
      │
      ▼
Verify OTP
      │
      ▼
Create Username & Password
      │
      ▼
Account Activated
      │
      ▼
Login
      │
      ▼
JWT Token
```

---
# Forgot Password Flow

```
Forgot Password
        │
        ▼
Enter Username
        │
        ▼
Validate User
        │
        ▼
Generate OTP
        │
        ▼
Store OTP (Purpose: FORGOT_PASSWORD)
        │
        ▼
Send OTP
        │
        ▼
Verify OTP
        │
        ▼
Mark OTP as Verified
        │
        ▼
Reset Password
        │
        ▼
Delete OTP
        │
        ▼
Login with New Password
```

### Notes

- OTP expires after **15 minutes**.
- Only one active OTP is allowed per phone number and purpose.
- Passwords are securely hashed using **bcryptjs** before being stored.
- After a successful password reset, the corresponding OTP record is deleted.
- A user must verify the OTP before resetting the password.

## Future Modules

- Event Management
- Guest Management
- WhatsApp Invitations
- Invitation Templates
- RSVP Tracking
- QR Code Invitations
- Event Reminder Scheduler
- Dashboard Analytics
- Admin Panel
- Notification Service

---

## Future Event Types

- Wedding
- Engagement
- Birthday
- Housewarming
- Baby Shower
- Anniversary
- Corporate Event
- Reunion
- Conference

---

## Author

**InviteFlow Team**

**Tagline**

> **Invite Loved Ones Together.**