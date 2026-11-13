import { API_URL } from './Session';

// The API builds file links from the Host header it receives, so behind a proxy or a
// public tunnel they can come back as http://... or with the wrong address, and the
// browser blocks them ("Failed to fetch"). Keep only the path and send the request
// through API_URL (empty = same address as the page, so the Vite proxy handles it).
function toApiUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith('/api/') || parsed.pathname.startsWith('/storage/')) {
      return `${API_URL}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* not a valid URL, use it as it is */
  }
  return url;
}

// Fetches a protected file with the user's Bearer token and returns it as a Blob.
// Needed because <iframe src> and <a href> cannot send an Authorization header.
export async function fetchBlob(url, token, signal) {
  if (!token) {
    throw new Error('Please sign in to view or download this file.');
  }

  const response = await fetch(toApiUrl(url), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    let message = `Could not load the file (${response.status}).`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      /* response body was not JSON */
    }
    throw new Error(message);
  }

  return response.blob();
}

// Triggers a browser "save file" for a Blob.
export function saveBlob(blob, filename = 'reviewer') {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}