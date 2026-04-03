/** Fetch admin avec cookie httpOnly (session). */
export function adminFetch(input, init = {}) {
  return fetch(input, {
    ...init,
    credentials: "include",
    headers: { ...init.headers },
  });
}
