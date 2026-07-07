import type { StateStorage } from "zustand/middleware";

const fallbackStorage = new Map<string, string>();
const signedOutStorageScope = "signed-out";
let careerFoxStorageUserId: string | null = null;

let asyncStoragePromise: Promise<StateStorage | null> | null = null;

const getStorageSafeSegment = (value: string) =>
  value.replace(/[^A-Za-z0-9._-]/g, "_") || "unknown";

export function getCareerFoxStorageScopeKey(userId: string | null) {
  return getStorageSafeSegment(userId ?? signedOutStorageScope);
}

const getScopedStorageName = (name: string) =>
  `${getStorageSafeSegment(name)}.${getCareerFoxStorageScopeKey(
    careerFoxStorageUserId,
  )}`;

export function setCareerFoxStorageUserId(userId: string | null) {
  careerFoxStorageUserId = userId;
}

async function getAsyncStorage() {
  asyncStoragePromise ??= import("@react-native-async-storage/async-storage")
    .then((module) => module.default as StateStorage)
    .catch(() => null);

  return asyncStoragePromise;
}

export const careerFoxStorage: StateStorage = {
  getItem: async (name) => {
    const scopedName = getScopedStorageName(name);
    const storage = await getAsyncStorage();

    if (!storage) {
      return fallbackStorage.get(scopedName) ?? null;
    }

    try {
      return await storage.getItem(scopedName);
    } catch {
      return fallbackStorage.get(scopedName) ?? null;
    }
  },
  removeItem: async (name) => {
    const scopedName = getScopedStorageName(name);
    const storage = await getAsyncStorage();

    if (!storage) {
      fallbackStorage.delete(scopedName);
      return;
    }

    try {
      await storage.removeItem(scopedName);
    } catch {
      fallbackStorage.delete(scopedName);
    }
  },
  setItem: async (name, value) => {
    const scopedName = getScopedStorageName(name);
    const storage = await getAsyncStorage();

    if (!storage) {
      fallbackStorage.set(scopedName, value);
      return;
    }

    try {
      await storage.setItem(scopedName, value);
    } catch {
      fallbackStorage.set(scopedName, value);
    }
  },
};
