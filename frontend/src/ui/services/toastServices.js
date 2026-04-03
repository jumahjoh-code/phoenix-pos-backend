const listeners = [];

export const subscribe = (fn) => {
  listeners.push(fn);
};

export const toast = (message) => {
  listeners.forEach(fn => fn(message));
};
