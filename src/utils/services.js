// apiServices.js
import { fetcher, filesFetch } from './apiBase';

// Base URL configuration
const apiUrl = 'https://esamwad.iotcom.io/';

/**
 * Authentication Services
 */
export const authService = {
  // Login authentication
  login: (username, credentials) => fetcher('POST', apiUrl + `userlogin/${username}`, credentials),
};

export default {
  auth: authService,
};
