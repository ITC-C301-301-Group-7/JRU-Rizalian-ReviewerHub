export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

const TOKEN_KEY = 'reviewerhub_token';

export function loadToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

// remember = true  -> survives closing the browser (localStorage)
// remember = false -> cleared when the tab closes (sessionStorage)
export function saveToken(token, remember = true) {
  clearToken();

  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable: the user stays signed in until they refresh */
  }
}

// Same shape LoginForm / SignUpForm hand to App after a successful sign-in.
export function normalizeUser(user, token) {
  return {
    ...user,
    token,
    studentNumber: user.student_number,
    facultyId: user.faculty_id,
    yearLevel: user.year_level,
    points: 0,
    contributions: 0,
    contributedReviewersCount: 0,
    upvotesReceived: 0,
    savedReviewersCount: 0,
    badgesEarned: [],
  };
}

export async function fetchCurrentUser(token, signal) {
  const response = await fetch(`${API_URL}/api/user`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    const error = new Error('Could not restore your session.');
    error.status = response.status;
    throw error;
  }

  return normalizeUser(await response.json(), token);
}

// Best effort: the local sign-out must work even if the server is unreachable.
export async function logoutRequest(token) {
  if (!token) return;

  try {
    await fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    /* ignore network errors */
  }
}