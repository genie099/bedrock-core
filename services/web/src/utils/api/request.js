import { API_URL } from 'utils/env';
import { ApiError, ApiParseError } from './errors';

// Stub to enable analytics
// import { trackRequest } from '../analytics';

export default async function request(options) {
  const { method = 'GET', path, files, params } = options;
  let { body } = options;

  const token = options.token || localStorage.getItem('jwt');

  const headers = Object.assign(
    {
      Accept: 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    },
    options.headers
  );

  const url = new URL(path, API_URL);
  url.search = new URLSearchParams(params);

  if (files) {
    const data = new FormData();
    files.forEach((file) => {
      data.append('file', file);
    });
    for (let [key, value] of Object.entries(body)) {
      data.append(key, value);
    }
    body = data;
  } else if (!(body instanceof FormData)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  if (res.status === 204) {
    return;
  } else if (!res.ok) {
    let message, status, details;
    try {
      const data = await res.clone().json();
      if (data.error) {
        message = data.error.message;
        status = data.error.status;
        details = data.error.details;
      }
    } catch (err) {
      message = await res.clone().text();
    }
    throw new ApiError(message || res.statusText, status || res.status, details);
  }

  try {
    const response = await res.json();
    // Stub to track requests
    // trackRequest(options, response.data);
    return response;
  } catch (err) {
    throw new ApiParseError();
  }
}
