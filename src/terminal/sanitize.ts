/**
 * HTML sanitizer to prevent XSS in terminal output.
 * Escapes angle brackets so user-supplied text can't inject HTML.
 */
export const sanitizeHTML = (str: string): string => {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
