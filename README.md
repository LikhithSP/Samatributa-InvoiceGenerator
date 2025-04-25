# Invoice Generator

A professional invoice generator application with support for USD and INR currencies, using React and Vite.

## Features

- Modern UI with clean design principles
- Authentication system with session timeout handling
- Dual currency support (USD and INR) with automatic conversion using real-time exchange rates
- PDF generation and download using jsPDF and html2canvas
- Email sending capability via EmailJS
- Tax calculation and detailed invoice preview
- Responsive design with dark mode toggle
- Comprehensive form validation
- Environment variable support for secure credential management
- Custom modal dialogs for better user experience
- Global error management with React Context API

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/invoice-generator.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in your EmailJS credentials and API keys:
   ```
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
   ```

4. **Development mode:**
   ```bash
   npm run dev
   ```

5. **Production build and serve:**
   ```bash
   npm start
   ```

## Project Structure

The application follows a standardized structure for React applications:

```
/
├── public/              # Static assets
│   ├── images/          # Public images (accessed as /images/...)
│   └── favicon.ico      # Favicon
├── src/
│   ├── assets/          # Imported assets (processed by build)
│   │   └── images/      # Application images
│   ├── components/      # Reusable React components
│   ├── config/          # Configuration files and environment variables
│   ├── constants/       # Application constants and enums
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Business logic modules
│   ├── pages/           # Page components (routes)
│   ├── services/        # API and external service integrations
│   ├── types/           # TypeScript/JSDoc type definitions
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main App component
│   ├── App.css          # Global styles
│   ├── main.jsx         # Application entry point
│   └── index.css        # Base styles
├── .env                 # Environment variables (not committed)
├── .env.example         # Example environment variables
├── server.js            # Express server for production
└── vite.config.js       # Vite configuration
```

## Architecture Overview

This application follows a modular architecture that separates concerns:

### Core Directories:

- **components/**: Reusable UI components with minimal business logic
- **pages/**: Page-level components that compose smaller components
- **hooks/**: Custom React hooks for shared stateful logic
- **context/**: React Context providers for global state management
- **lib/**: Pure business logic with no UI dependencies
- **services/**: External API integrations and third-party services
- **utils/**: Pure utility functions for common operations

### Key Files:

- **config/appConfig.js**: Central configuration for the application
- **constants/index.js**: Application-wide constants
- **hooks/useAuth.js**: Authentication logic
- **hooks/useForm.js**: Form handling utilities
- **services/emailService.js**: EmailJS integration
- **services/exchangeRateService.js**: Currency exchange rate API
- **services/pdfService.js**: PDF generation using jsPDF
- **utils/storage.js**: LocalStorage wrapper with improved API
- **utils/validationUtils.js**: Form validation utilities

## Best Practices Implemented

1. **Separation of Concerns**: UI components are separated from business logic
2. **Centralized Configuration**: Application settings are managed in config/
3. **Custom Hooks**: Reusable stateful logic is extracted into hooks/
4. **Service Modules**: External API integrations are isolated in services/
5. **Utility Functions**: Common operations are centralized in utils/
6. **Type Definitions**: Data structures are documented in types/
7. **Environment Variables**: Sensitive data is managed via .env files

## License

This project is licensed under the MIT License - see the LICENSE file for details.


