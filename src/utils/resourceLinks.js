// Share links and QR codes for learning resources.
//
// A QR code simply holds a link like  https://your-site/?resource=12.
//  - Scanning it with a phone camera opens the site; after sign-in the resource opens.
//  - The in-app scanner reads the same link and opens the resource directly.
//
// Testing from a phone on the same Wi-Fi: set VITE_PUBLIC_APP_URL (e.g. http://192.168.1.5:5173)
// in the frontend .env so generated QR codes do not point at "localhost".

const PENDING_KEY = 'reviewerhub_pending_resource';

export const buildResourceLink = (id) => {
  const base = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
  return `${base}/?resource=${id}`;
};

// Accepts a ReviewerHub link (any host) or "reviewerhub:resource:12". Returns the id or null.
export const parseResourceId = (text) => {
  const raw = String(text || '').trim();

  const short = raw.match(/^reviewerhub:resource:(\d+)$/i);
  if (short) return Number(short[1]);

  try {
    const id = new URL(raw).searchParams.get('resource');
    if (id && /^\d+$/.test(id)) return Number(id);
  } catch {
    /* not a URL */
  }

  return null;
};

// Called once on page load: remembers ?resource=ID (the user may still need to sign in)
// and removes it from the address bar.
export const captureIncomingResource = () => {
  try {
    const url = new URL(window.location.href);
    const id = url.searchParams.get('resource');

    if (id && /^\d+$/.test(id)) {
      sessionStorage.setItem(PENDING_KEY, id);
      url.searchParams.delete('resource');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  } catch {
    /* storage unavailable */
  }
};

// Returns the remembered resource id (once) after the user is signed in.
export const takePendingResource = () => {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    if (id) sessionStorage.removeItem(PENDING_KEY);
    return id ? Number(id) : null;
  } catch {
    return null;
  }
};