type Listener = (count: number) => void;

let pendingCount = 0;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener(pendingCount));

export const loadingStore = {
  increment() {
    pendingCount += 1;
    emit();
  },

  decrement() {
    pendingCount = Math.max(0, pendingCount - 1);
    emit();
  },

  getSnapshot() {
    return pendingCount;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
