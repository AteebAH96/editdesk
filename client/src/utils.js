// Shared frontend helpers: labels and date formatting.

export const TYPE_LABELS = {
  reel: 'Reel / Short',
  promo: 'Promo / Ad',
  cinematic: 'Cinematic Edit',
  tiktok: 'TikTok',
  other: 'Other',
};

export const ORDER_STATUSES = ['Pending', 'In Progress', 'In Review', 'Delivered'];

// Mirrors the backend pipeline so the admin UI only offers valid moves.
export const ALLOWED_TRANSITIONS = {
  Pending: ['In Progress'],
  'In Progress': ['In Review'],
  'In Review': ['In Progress', 'Delivered'],
  Delivered: [],
};

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
