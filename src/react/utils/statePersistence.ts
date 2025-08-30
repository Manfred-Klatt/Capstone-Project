/**
 * State Persistence Utility
 * 
 * This utility provides functions to persist and retrieve state between
 * React and non-React parts of the application using localStorage.
 */

// We use fixed key prefixes for consistency

// Keys for different state types
const STATE_KEYS = {
  AUTH: `acnh_auth_state`,
  GAME: `acnh_game_state`,
  USER_PREFERENCES: `acnh_user_preferences`,
  NAVIGATION: `acnh_navigation_state`,
};

/**
 * Save state to localStorage
 * @param key The state key identifier
 * @param data The data to persist
 */
export const saveState = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

/**
 * Load state from localStorage
 * @param key The state key identifier
 * @returns The parsed data or null if not found
 */
export const loadState = <T>(key: string): T | null => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return null;
  }
};

/**
 * Remove state from localStorage
 * @param key The state key identifier
 */
export const removeState = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing state from localStorage:', error);
  }
};

/**
 * Save authentication state
 * @param authState The authentication state to save
 */
export const saveAuthState = (authState: {
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  isAuthenticated: boolean;
}): void => {
  saveState(STATE_KEYS.AUTH, authState);
};

/**
 * Load authentication state
 * @returns The authentication state or null if not found
 */
export const loadAuthState = () => {
  return loadState<{
    token?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    isAuthenticated: boolean;
  }>(STATE_KEYS.AUTH);
};

/**
 * Save game state for persistence between page navigations
 * @param gameState The game state to save
 */
export const saveGameState = (gameState: any): void => {
  saveState(STATE_KEYS.GAME, gameState);
};

/**
 * Load game state
 * @returns The game state or null if not found
 */
export const loadGameState = () => {
  return loadState<any>(STATE_KEYS.GAME);
};

/**
 * Save user preferences
 * @param preferences User preferences object
 */
export const saveUserPreferences = (preferences: any): void => {
  saveState(STATE_KEYS.USER_PREFERENCES, preferences);
};

/**
 * Load user preferences
 * @returns User preferences or null if not found
 */
export const loadUserPreferences = () => {
  return loadState<any>(STATE_KEYS.USER_PREFERENCES);
};

/**
 * Save navigation state (for returning to previous pages)
 * @param navigationState Navigation state object
 */
export const saveNavigationState = (navigationState: {
  previousPath: string;
  returnTo?: string;
}): void => {
  saveState(STATE_KEYS.NAVIGATION, navigationState);
};

/**
 * Load navigation state
 * @returns Navigation state or null if not found
 */
export const loadNavigationState = () => {
  return loadState<{
    previousPath: string;
    returnTo?: string;
  }>(STATE_KEYS.NAVIGATION);
};

export default {
  saveState,
  loadState,
  removeState,
  saveAuthState,
  loadAuthState,
  saveGameState,
  loadGameState,
  saveUserPreferences,
  loadUserPreferences,
  saveNavigationState,
  loadNavigationState,
  STATE_KEYS,
};
