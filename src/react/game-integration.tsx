import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import GameContainer from './components/game/GameContainer';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Leaderboard from './components/leaderboard/Leaderboard';

// Import styles
import './index.css';
import './components/game/Game.css';
import './components/layout/Layout.css';
import '../css/shared-variables.css';

/**
 * Detects if the script is running in standalone mode
 * (directly loaded in browser vs. imported as a module)
 */
const isStandalone = typeof window !== 'undefined' && 
  !window.hasOwnProperty('importScripts') && 
  document.currentScript && 
  document.currentScript.getAttribute('src');

/**
 * Creates a wrapper component that includes the Header and Footer
 * @param Component The component to wrap
 * @returns A wrapped component with Header and Footer
 */
const withLayout = (Component: React.ComponentType) => {
  return () => (
    <React.Fragment>
      <Header />
      <main className="app-main">
        <Component />
      </main>
      <Footer />
    </React.Fragment>
  );
};

/**
 * Renders a React component into a container element
 * @param Component The React component to render
 * @param containerId The ID of the container element
 */
const renderComponent = (Component: React.ComponentType, containerId: string) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <LeaderboardProvider>
              <GameProvider>
                <Component />
              </GameProvider>
            </LeaderboardProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } else {
    console.error(`Container with ID "${containerId}" not found.`);
  }
};

/**
 * Initializes the React components when the DOM is loaded
 */
const initReactComponents = () => {
  // Render Header component
  renderComponent(Header, 'react-header');
  
  // Render Game component
  renderComponent(
    () => (
      <LeaderboardProvider>
        <GameProvider>
          <GameContainer />
        </GameProvider>
      </LeaderboardProvider>
    ),
    'react-game'
  );
  
  // Render Leaderboard component if the container exists
  const leaderboardContainer = document.getElementById('react-leaderboard');
  if (leaderboardContainer) {
    renderComponent(
      () => (
        <LeaderboardProvider>
          <Leaderboard />
        </LeaderboardProvider>
      ),
      'react-leaderboard'
    );
  }
  
  // Render Footer component
  renderComponent(Footer, 'react-footer');
};

// Execute initialization if running in standalone mode
if (isStandalone) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactComponents);
  } else {
    initReactComponents();
  }
}

// Export components and functions for external use
export {
  GameContainer,
  Header,
  Footer,
  Leaderboard,
  withLayout,
  renderComponent,
  initReactComponents
};
