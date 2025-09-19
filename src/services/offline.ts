import { Course } from '@/types/golf';
import { Round } from '@/types/golf';

export interface OfflineData {
  courses: Course[];
  rounds: Round[];
  photos: { [key: string]: string }; // photo ID -> base64 data
  lastSync: string;
}

export class OfflineService {
  private static readonly STORAGE_KEY = 'golf-app-offline-data';
  private static readonly CACHE_NAME = 'golf-app-v1';

  static async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getOfflineData(): OfflineData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse offline data:', error);
      }
    }
    
    return {
      courses: [],
      rounds: [],
      photos: {},
      lastSync: new Date().toISOString()
    };
  }

  static saveOfflineData(data: OfflineData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  static saveCourses(courses: Course[]) {
    const data = this.getOfflineData();
    data.courses = courses;
    data.lastSync = new Date().toISOString();
    this.saveOfflineData(data);
  }

  static saveRound(round: Round) {
    const data = this.getOfflineData();
    const existingIndex = data.rounds.findIndex(r => r.id === round.id);
    
    if (existingIndex >= 0) {
      data.rounds[existingIndex] = round;
    } else {
      data.rounds.push(round);
    }
    
    data.lastSync = new Date().toISOString();
    this.saveOfflineData(data);
  }

  static getRounds(): Round[] {
    return this.getOfflineData().rounds;
  }

  static getCourses(): Course[] {
    return this.getOfflineData().courses;
  }

  static async savePhotoOffline(photoId: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const data = this.getOfflineData();
        data.photos[photoId] = base64;
        this.saveOfflineData(data);
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static getPhoto(photoId: string): string | null {
    const data = this.getOfflineData();
    return data.photos[photoId] || null;
  }

  static clearOfflineData() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getStorageUsage(): { used: number; quota: number } {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      });
    }
    
    // Fallback estimation
    const data = localStorage.getItem(this.STORAGE_KEY);
    const used = data ? new Blob([data]).size : 0;
    
    return {
      used,
      quota: 5 * 1024 * 1024 // 5MB estimate for localStorage
    };
  }

  static async preloadAssets(urls: string[]) {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.CACHE_NAME);
      await cache.addAll(urls);
    } catch (error) {
      console.error('Failed to preload assets:', error);
    }
  }
}