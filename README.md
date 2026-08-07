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
```

---

## Start Development Server

```bash
npm run seed
npm run dev
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

---

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