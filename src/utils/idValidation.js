// Checks if the JRU Student ID is valid (2 digits - 6 digits, e.g., 23-123456)
export const isJruIdValid = (id) => {
  if (!id) return false;
  return /^\d{2}-\d{6}$/.test(id.trim());
};

// Returns a user-friendly validation error message for JRU Student IDs
export const getJruIdValidationError = (id) => {
  if (!id || id.trim() === '') {
    return 'Student ID is required.';
  }
  const cleanId = id.trim();
  if (!/^\d{2}-\d{6}$/.test(cleanId)) {
    return 'Invalid ID format. Must be formatted as YY-XXXXXX (e.g., 23-123456).';
  }
  return '';
};

// Automatically formats inputs into JRU ID format (e.g., "23123456" -> "23-123456")
export const formatJruId = (value) => {
  const raw = value.replace(/\D/g, ''); // Remove non-numeric characters
  if (raw.length <= 2) return raw;
  return `${raw.slice(0, 2)}-${raw.slice(2, 8)}`;
};

// Alias functions for compatibility
export const validateStudentId = (id) => isJruIdValid(id);

// School email domains that may register. Keep in sync with ALLOWED_EMAIL_DOMAINS in the backend .env.
export const ALLOWED_EMAIL_DOMAINS = ['jru.edu', 'my.jru.edu', 'jru.edu.ph'];

// True when the address ends with one of the school domains.
export const validateJruEmail = (email) => {
  const value = (email || '').trim().toLowerCase();
  const match = /^[a-z0-9._%+-]+@([a-z0-9.-]+)$/.exec(value);
  return Boolean(match) && ALLOWED_EMAIL_DOMAINS.includes(match[1]);
};

export const getJruEmailValidationError = (email) => {
  if (!email || !email.trim()) return 'Please provide your JRU email address.';
  if (!validateJruEmail(email)) {
    return `Please use your JRU email address (@${ALLOWED_EMAIL_DOMAINS.join(', @')}).`;
  }
  return '';
};