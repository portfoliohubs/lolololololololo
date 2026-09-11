import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import type { DeviceInfo, RateLimiterState } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAeRPr0xDjGtSG-PKmlc98g0u-d72oB40g",
  authDomain: "parmaga-c67d4.firebaseapp.com",
  projectId: "parmaga-c67d4",
  storageBucket: "parmaga-c67d4.firebasestorage.app",
  messagingSenderId: "879075300856",
  appId: "1:879075300856:web:0ea04352c2418cec4ff20d",
  measurementId: "G-MFZPB2FFP9"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection per Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
    }
    // Connection attempt recorded
    return false;
  }
}

/**
 * Single Device Lock: Unique Device Fingerprint generator
 * Generates an immutable, stable identifier per device/browser.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_mock';
  
  const STORAGE_KEY = 'parmaga_active_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Generate high-entropy hardware & session fingerprint
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const ua = navigator.userAgent;
    const randomEntropy = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    
    // Create deterministic simple hash
    let hash = 0;
    const combined = `${ua}|${screenInfo}|${randomEntropy}`;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    deviceId = `PRM-DEV-${hex.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}

export function getDeviceInfo(): DeviceInfo {
  const deviceId = getOrCreateDeviceId();
  let browser = 'المتصفح الحديث';
  let os = 'نظام التشغيل';

  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Safari')) browser = 'Apple Safari';

    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  }

  return {
    deviceId,
    browser,
    os,
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080',
    timestamp: Date.now(),
  };
}

/**
 * 3-Strike Rate Limiter for Login Attempts
 * Enforces 15-minute freeze on 3 failed password attempts.
 */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function getRateLimiterKey(identifier?: string): string {
  const cleanId = (identifier || 'global').trim().toLowerCase();
  return `parmaga_ratelimit_${cleanId}`;
}

export function getRateLimiterState(identifier?: string): RateLimiterState {
  if (typeof window === 'undefined') {
    return { failedAttempts: 0, isLocked: false, lockExpiresAt: null, remainingSeconds: 0 };
  }

  const key = getRateLimiterKey(identifier);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { failedAttempts: 0, isLocked: false, lockExpiresAt: null, remainingSeconds: 0 };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockExpiresAt && data.lockExpiresAt > now) {
      const remainingSeconds = Math.ceil((data.lockExpiresAt - now) / 1000);
      return {
        failedAttempts: data.failedAttempts || 3,
        isLocked: true,
        lockExpiresAt: data.lockExpiresAt,
        remainingSeconds,
      };
    }

    // Lock expired, reset if time passed
    if (data.lockExpiresAt && data.lockExpiresAt <= now) {
      localStorage.removeItem(key);
      return { failedAttempts: 0, isLocked: false, lockExpiresAt: null, remainingSeconds: 0 };
    }

    return {
      failedAttempts: data.failedAttempts || 0,
      isLocked: false,
      lockExpiresAt: null,
      remainingSeconds: 0,
    };
  } catch {
    return { failedAttempts: 0, isLocked: false, lockExpiresAt: null, remainingSeconds: 0 };
  }
}

export function recordFailedAttempt(identifier?: string): RateLimiterState {
  const key = getRateLimiterKey(identifier);
  const current = getRateLimiterState(identifier);
  const newAttempts = current.failedAttempts + 1;
  const now = Date.now();

  if (newAttempts >= 3) {
    const lockExpiresAt = now + LOCKOUT_DURATION_MS;
    const state: RateLimiterState = {
      failedAttempts: newAttempts,
      isLocked: true,
      lockExpiresAt,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
    localStorage.setItem(key, JSON.stringify(state));
    return state;
  }

  const state: RateLimiterState = {
    failedAttempts: newAttempts,
    isLocked: false,
    lockExpiresAt: null,
    remainingSeconds: 0,
  };
  localStorage.setItem(key, JSON.stringify(state));
  return state;
}

export function resetFailedAttempts(identifier?: string): void {
  if (typeof window === 'undefined') return;
  const key = getRateLimiterKey(identifier);
  localStorage.removeItem(key);
}
