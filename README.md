# Alumni Management Platform

A comprehensive platform for managing alumni networks, events, donations, and job postings.

## Features

- 🔐 **Authentication**: Email/password and Google OAuth sign-in
- 👥 **Alumni Management**: Track and manage alumni profiles
- 📅 **Event Management**: Create and manage events with guest lists
- 💰 **Donation Tracking**: Monitor and record alumni donations
- 💼 **Job Board**: Post and manage job opportunities
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## Tech Stack

**Frontend:**
- React + Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Zustand (state management)
- Framer Motion (animations)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Passport.js (OAuth)
- JWT authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Google OAuth credentials (for social login)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Alumni_Management_Platform_Final
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Environment Configuration

1. **Backend Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/alumni_management
   JWT_SECRET=your_jwt_secret_key_here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   CLIENT_URL=http://localhost:5173
   ```

2. **Get Google OAuth Credentials**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select existing one
   
   c. Navigate to **APIs & Services** > **Credentials**
   
   d. Click **Create Credentials** > **OAuth client ID**
   
   e. Configure OAuth consent screen (if not done):
      - User Type: External
      - App name: Alumni Management Platform
      - User support email: your-email@example.com
      - Developer contact: your-email@example.com
   
   f. Create OAuth client ID:
      - Application type: Web application
      - Name: Alumni Platform OAuth
      - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   
   g. Copy the **Client ID** and **Client Secret** to your `.env` file

### Running the Application

1. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on http://localhost:5173

## Google OAuth Flow

1. User clicks "Continue with Google" on login/register page
2. User is redirected to Google's consent screen
3. After approval, Google redirects to `/api/auth/google/callback`
4. Backend creates/finds user and generates JWT token
5. User is redirected to `/auth/callback?token=<jwt>`
6. Frontend extracts token and saves to auth store
7. User is redirected to dashboard

## Key Features

### Authentication System
- Traditional email/password registration and login
- Google OAuth social login
- JWT-based session management
- Automatic account linking (Google + email users)

### Event Management
- Create events with date, time, location, and capacity
- Add guests by email
- Avatar display for guests (UI Avatars API)
- Date picker with past date restrictions
- Time validation (HH:mm format)

### Alumni Profiles
- Graduation year and department tracking
- Profile pictures (from Google or uploads)
- Contact information

### Admin Features
- Protected admin routes
- Event, donation, and job management
- Guest list management

## Project Structure

```
Alumni_Management_Platform_Final/
├── backend/
│   ├── config/
│   │   └── passport.js         # Google OAuth configuration
│   ├── controllers/
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   ├── models/
│   │   ├── Alumni.js           # User schema with googleId
│   │   ├── Event.js            # Event schema with guests
│   │   ├── Donation.js
│   │   └── Job.js
│   ├── routes/
│   │   ├── authRoutes.js       # Auth + OAuth routes
│   │   ├── eventRoutes.js      # Event CRUD + guests
│   │   └── ...
│   ├── server.js               # Express app
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ui/                # shadcn components
    │   ├── pages/
    │   │   ├── Login.jsx          # With Google button
    │   │   ├── Register.jsx       # With Google button
    │   │   ├── AuthCallback.jsx   # OAuth callback handler
    │   │   ├── Events.jsx         # Event management
    │   │   └── ...
    │   ├── store/
    │   │   └── authStore.js       # Zustand auth state
    │   └── App.jsx
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)
- `POST /api/events/:id/guests` - Add guest to event (admin)
- `DELETE /api/events/:id/guests/:guestId` - Remove guest (admin)

### Alumni
- `GET /api/alumni` - Get all alumni
- `GET /api/alumni/:id` - Get single alumni
- `PUT /api/alumni/:id` - Update alumni

### More endpoints for donations, jobs, etc.

## Troubleshooting

### Google OAuth Issues

**"redirect_uri_mismatch" error:**
- Ensure `GOOGLE_CALLBACK_URL` in `.env` matches the authorized redirect URI in Google Console
- Must be exact match including http/https and port

**"Access blocked" error:**
- Check OAuth consent screen is configured
- Add test users if app is in testing mode

**Token not saved:**
- Check browser console for errors
- Verify `CLIENT_URL` in backend `.env` matches frontend URL

### Database Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify database permissions

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.
