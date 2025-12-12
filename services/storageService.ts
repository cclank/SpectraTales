import { StoryboardData } from "../types";

const DB_NAME = 'SpectraTalesDB';
const STORE_NAME = 'stories';
const DB_VERSION = 1;

/**
 * Initializes the IndexedDB database.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uid' });
      }
    };
  });
};

/**
 * Saves or updates a story in the database.
 */
export const saveStoryToDB = async (story: StoryboardData): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(story);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB", error);
    throw error;
  }
};

/**
 * Retrieves all stories from the database, sorted by newest first.
 */
export const getHistoryFromDB = async (): Promise<StoryboardData[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as StoryboardData[];
        // Sort by newest first
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
    });
  } catch (error) {
    console.error("Failed to load history from IndexedDB", error);
    return [];
  }
};
