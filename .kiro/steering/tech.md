# Technology Stack & Build System

## Frontend Stack
- **Framework**: React 18.x with Create React App
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with custom theme extensions
- **UI Components**: Custom components with Framer Motion animations
- **Icons**: React Icons library
- **Notifications**: React Hot Toast and React Toastify
- **Charts**: Recharts and Nivo for analytics visualization

## Backend & Services
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Functions**: Firebase Functions
- **Payment Processing**: 
  - Stripe for international payments
  - PayPal integration
  - M-Pesa for local Kenyan payments (separate Node.js server)

## Payment Server (M-Pesa)
- **Runtime**: Node.js with Express
- **Location**: `/mpesa` directory
- **Key Dependencies**: axios, cors, firebase, nodemailer, moment
- **Email Service**: Nodemailer with Handlebars templates

## Development Tools
- **Package Manager**: npm
- **CSS Framework**: Tailwind CSS with PostCSS
- **Testing**: Jest and React Testing Library
- **Code Quality**: ESLint with React app configuration

## Common Commands

### Frontend Development
```bash
npm start          # Start development server (localhost:3000)
npm run build      # Build for production
npm test           # Run test suite
npm run eject      # Eject from CRA (irreversible)
```

### M-Pesa Payment Server
```bash
cd mpesa
npm start          # Start production server (port 8000)
npm run dev        # Start with nodemon for development
```

## Environment Configuration
- Frontend: `.env` file in root directory
- M-Pesa Server: `.env` file in `/mpesa` directory
- Firebase config in `src/firebase/config.js`

## Deployment
- **Frontend**: Configured for Render deployment via `render.yaml`
- **M-Pesa Server**: Separate deployment (typically on port 8000)
- **Database**: Firebase Firestore (cloud-hosted)