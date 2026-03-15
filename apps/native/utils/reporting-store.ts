type Callback = () => void;

let _cb: Callback | null = null;

export const reportingStore = {
  register: (fn: Callback) => {
    _cb = fn;
  },
  unregister: () => {
    _cb = null;
  },
  trigger: () => {
    _cb?.();
  },
};
