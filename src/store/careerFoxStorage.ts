import type { StateStorage } from "zustand/middleware";

const fallbackStorage = new Map<string, string>();

let asyncStoragePromise: Promise<StateStorage | null> | null = null;

async function getAsyncStorage() {
  asyncStoragePromise ??= import("@react-native-async-storage/async-storage")
    .then((module) => module.default as StateStorage)
    .catch(() => null);

  return asyncStoragePromise;
}

export const careerFoxStorage: StateStorage = {
  getItem: async (name) => {
    const storage = await getAsyncStorage();

    if (!storage) {
      return fallbackStorage.get(name) ?? null;
    }

    return storage.getItem(name);
  },
  removeItem: async (name) => {
    const storage = await getAsyncStorage();

    if (!storage) {
      fallbackStorage.delete(name);
      return;
    }

    await storage.removeItem(name);
  },
  setItem: async (name, value) => {
    const storage = await getAsyncStorage();

    if (!storage) {
      fallbackStorage.set(name, value);
      return;
    }

    await storage.setItem(name, value);
  },
};
