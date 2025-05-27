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

export const contactService = {
  // Add or modify a contact
  addModifyContact: (payload) => fetcher('POST', apiUrl + 'addModifyContact', payload),
  usermissedCalls: (username) => fetcher('POST', apiUrl + `usermissedcalls/${username}`),
  dialmissedcall: (payload) => fetcher('POST', apiUrl + 'dialmissedcall', payload),
};

export default {
  auth: authService,
  contact: contactService,
};
