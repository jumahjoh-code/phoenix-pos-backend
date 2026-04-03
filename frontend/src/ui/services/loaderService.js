let listeners = [];

export function subscribeLoader(callback) {
  listeners.push(callback);

  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

export function showLoader() {
  listeners.forEach((cb) => cb(true));
}

export function hideLoader() {
  listeners.forEach((cb) => cb(false));
}
