# Project Structure & Organization

## Root Directory Structure
```
├── src/                    # Main React application
├── mpesa/                  # M-Pesa payment server (Node.js)
├── functions/              # Firebase Functions
├── public/                 # Static assets
├── .kiro/                  # Kiro AI assistant configuration
└── package.json            # Frontend dependencies
```

## Frontend Structure (`/src`)

### Core Application Files
- `App.js` - Main application component with routing
- `index.js` - React application entry point
- `App.css` & `index.css` - Global styles

### Component Organization
```
src/components/
├── admin/                  # Admin-specific components
├── analytics/              # Analytics and metrics components
├── inventory/              # Inventory management components
├── security/               # Security-related components
├── AdminLayout.js          # Admin panel layout wrapper
├── AdminRoute.js           # Admin route protection
├── PrivateRoute.js         # Authentication route protection
├── Navbar.js               # Main navigation component
└── [Feature]Components.js  # Feature-specific components
```

### Page Organization
```
src/pages/
├── admin/                  # Admin panel pages
│   ├── Dashboard.js        # Admin dashboard
│   ├── Products.js         # Product management
│   ├── Orders.js           # Order management
│   └── [Feature].js        # Other admin features
├── Home.js                 # Landing page
├── Products.js             # Product catalog
├── Cart.js                 # Shopping cart
├── Checkout.js             # Checkout process
└── [UserPages].js          # Other user-facing pages
```

### State Management
```
src/store/
├── store.js                # Redux store configuration
└── slices/                 # Redux Toolkit slices
    ├── authSlice.js        # Authentication state
    ├── cartSlice.js        # Shopping cart state
    ├── productSlice.js     # Product catalog state
    └── [feature]Slice.js   # Feature-specific state
```

### Utilities & Configuration
```
src/
├── firebase/config.js      # Firebase configuration
├── utils/                  # Utility functions
├── config/                 # Application configuration
├── types/                  # Type definitions
└── styles/                 # Shared styling utilities
```

## Backend Structure (`/mpesa`)
- `server.js` - Express server for M-Pesa integration
- `firebase.js` - Firebase configuration for server
- `emailService.js` - Email notification service
- `views/emails/` - Email templates (Handlebars)

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `ProductCard.js`)
- **Pages**: PascalCase (e.g., `ProductDetail.js`)
- **Utilities**: camelCase (e.g., `trackInteraction.js`)
- **Directories**: camelCase or kebab-case

### Code Conventions
- **React Components**: PascalCase function components
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Tailwind utility classes

## Route Structure
- **Public Routes**: `/`, `/login`, `/register`, `/products`
- **Protected Routes**: `/cart`, `/checkout`, `/orders`, `/profile`
- **Admin Routes**: `/admin/*` (nested routing)
- **Community Routes**: `/communities`, `/product-ideas`

## Asset Organization
- **Images**: `/public` for static assets, Firebase Storage for dynamic
- **Icons**: React Icons library (imported as needed)
- **Fonts**: Configured through Tailwind CSS