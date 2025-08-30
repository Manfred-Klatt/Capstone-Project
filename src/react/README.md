# React Authentication System

This directory contains the React-based authentication system for the Animal Crossing Quiz Game.

## Structure

- `index.tsx`: Main entry point for the React SPA
- `App.tsx`: Main application component with routing
- `react-integration.ts`: Integration script for embedding React components in HTML pages
- `components/`: React components organized by feature
  - `auth/`: Authentication-related components
    - `Login.tsx`: Login form component
    - `Register.tsx`: Registration form component
    - `AuthContainer.tsx`: Container for auth components
    - `ProtectedRoute.tsx`: Route protection component
- `context/`: React context providers
  - `AuthContext.tsx`: Authentication context and provider
- `config/`: Configuration files
  - `clientConfig.ts`: Client-side configuration (no secrets)

## Integration

The React authentication system can be used in two ways:

1. **Standalone SPA**: Access through `react-auth.html` for a full React single-page application experience
2. **Embedded Components**: Individual components can be embedded in existing HTML pages using the `react-integration.ts` script

## Security

- All sensitive information (API keys, database credentials) is kept server-side
- Client-side configuration in `clientConfig.ts` contains only public information
- JWT tokens are stored in localStorage for authentication

## Standalone Mode

The application supports a standalone mode that works without a server connection:
- Detects when server is unavailable
- Offers users the option to continue in standalone mode
- Stores user data locally
- Provides guest play option

## Build Process

To build the React components:

```bash
npm run build:react
```

This will:
1. Compile TypeScript files
2. Bundle React components with Vite
3. Output to the dist directory

## Development

To run the development server:

```bash
npm run dev:client
```
