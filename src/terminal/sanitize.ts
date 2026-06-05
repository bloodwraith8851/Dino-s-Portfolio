import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string using DOMPurify to prevent XSS in terminal output.
 * Returns an empty string for falsy input.
 *
 * @param str - Raw HTML string from user input or external data.
 * @returns A sanitized HTML string safe for `innerHTML` / `dangerouslySetInnerHTML`.
 */
export const sanitizeHTML = (str: string): string => {
  if (!str) return '';
  return DOMPurify.sanitize(str);
};
