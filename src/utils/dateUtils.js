/**
 * Format date string (YYYY-MM-DD or ISO or date string) into human readable format like "15 Aug 1990"
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatDateDisplay(dateVal) {
  if (!dateVal) return '';
  try {
    const str = String(dateVal).trim();
    if (!str) return '';

    // Handle YYYY-MM-DD cleanly without timezone shifts
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (err) {
    console.warn('Error formatting date:', err);
  }
  return String(dateVal);
}
