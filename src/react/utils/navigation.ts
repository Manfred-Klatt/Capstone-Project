/**
 * Navigation Utility
 * 
 * This utility provides functions to handle navigation between React and non-React pages,
 * preserving state and ensuring a seamless user experience.
 */

import { saveNavigationState, loadNavigationState } from './statePersistence';

/**
 * Navigate to a non-React page with state preservation
 * @param url The URL to navigate to
 * @param returnPath Optional path to return to after the navigation
 */
export const navigateToNonReactPage = (url: string, returnPath?: string): void => {
  // Save current path for potential return
  if (returnPath) {
    saveNavigationState({
      previousPath: window.location.pathname,
      returnTo: returnPath
    });
  } else {
    saveNavigationState({
      previousPath: window.location.pathname
    });
  }
  
  // Navigate to the non-React page
  window.location.href = url;
};

/**
 * Check if there's a return path from a non-React page
 * @returns The return path or null if none exists
 */
export const getReturnPath = (): string | null => {
  const navigationState = loadNavigationState();
  return navigationState?.returnTo || null;
};

/**
 * Navigate back to the previous page if available
 * @param defaultPath Default path to navigate to if no previous path exists
 */
export const navigateBack = (defaultPath: string = '/'): void => {
  const navigationState = loadNavigationState();
  if (navigationState?.previousPath) {
    window.location.href = navigationState.previousPath;
  } else {
    window.location.href = defaultPath;
  }
};

/**
 * Add query parameters to a URL
 * @param baseUrl The base URL
 * @param params Object containing query parameters
 * @returns URL with query parameters
 */
export const addQueryParams = (baseUrl: string, params: Record<string, string>): string => {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
};

/**
 * Get query parameters from the current URL
 * @param param Specific parameter to get (optional)
 * @returns All query parameters as an object, or a specific parameter value
 */
export const getQueryParams = (param?: string): string | Record<string, string> => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  
  if (param) {
    return urlSearchParams.get(param) || '';
  }
  
  const params: Record<string, string> = {};
  urlSearchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

export default {
  navigateToNonReactPage,
  getReturnPath,
  navigateBack,
  addQueryParams,
  getQueryParams
};
