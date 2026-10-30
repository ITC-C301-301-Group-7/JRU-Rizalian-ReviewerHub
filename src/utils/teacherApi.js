import { API_URL } from './Session';

// Small wrapper for the faculty endpoints: adds the Bearer token, parses JSON,
// and turns validation / server errors into readable Error messages.
// The thrown Error carries `.status` so callers can react to 401 / 403 / 422.
export async function teacherRequest(path, token, { method = 'GET', body, signal } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw requestError(response.status, data);
  }

  return data;
}

function requestError(status, data) {
  const message =
    status === 401
      ? 'Your session has expired. Please sign in again.'
      : data?.errors
        ? Object.values(data.errors).flat().join(' ')
        : data?.message || `Request failed (${status}).`;

  const error = new Error(message);
  error.status = status;
  return error;
}

// Multipart upload with a progress callback (fetch() cannot report upload progress).
// Returns { promise, abort }: call abort() to cancel; the promise then rejects with
// an Error whose name is "AbortError", matching how fetch() behaves.
export function uploadWithProgress(path, token, formData, onProgress) {
  const xhr = new XMLHttpRequest();

  const promise = new Promise((resolve, reject) => {
    xhr.open('POST', `${API_URL}/api${path}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* response body was not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(requestError(xhr.status, data));
    };

    xhr.onerror = () => reject(new Error('Network error. Check your connection and try again.'));
    xhr.onabort = () => {
      const error = new Error('Upload cancelled.');
      error.name = 'AbortError';
      reject(error);
    };

    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

export const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

// Same helper, with a neutral name for the student-facing features.
export { teacherRequest as apiRequest };