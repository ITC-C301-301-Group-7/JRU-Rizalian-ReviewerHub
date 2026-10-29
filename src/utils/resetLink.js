// Reads the password-reset link from the address bar (/?reset_token=...&email=...)
// and removes it from the URL so the token does not stay in browser history.
export const takeResetLink = () => {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('reset_token');
    const email = url.searchParams.get('email');

    if (!token || !email) return null;

    url.searchParams.delete('reset_token');
    url.searchParams.delete('email');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);

    return { token, email };
  } catch {
    return null;
  }
};