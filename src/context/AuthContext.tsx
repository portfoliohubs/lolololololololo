import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  getOrCreateDeviceId,
  getDeviceInfo,
  getRateLimiterState,
  recordFailedAttempt,
  resetFailedAttempts,
  testFirestoreConnection,
} from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import type { UserProfile, DeviceInfo, RateLimiterState } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  deviceInfo: DeviceInfo;
  loading: boolean;
  activeDeviceMismatch: boolean;
  mismatchedDeviceId: string | null;
  needsWatermarkConsent: boolean;
  rateLimiter: RateLimiterState;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (fullName: string, email: string, pass: string, phone: string, governorate: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  acceptWatermarkConsent: () => Promise<void>;
  resetDeviceLock: (targetUid?: string) => Promise<void>;
  simulateSecondDevice: (enable: boolean) => void;
  isSimulatingSecondDevice: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());
  const [activeDeviceMismatch, setActiveDeviceMismatch] = useState<boolean>(false);
  const [mismatchedDeviceId, setMismatchedDeviceId] = useState<string | null>(null);
  const [needsWatermarkConsent, setNeedsWatermarkConsent] = useState<boolean>(false);
  const [rateLimiter, setRateLimiter] = useState<RateLimiterState>(getRateLimiterState());
  const [isSimulatingSecondDevice, setIsSimulatingSecondDevice] = useState<boolean>(false);

  // Sync rate limiter countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRateLimiter(prev => {
        if (!prev.isLocked || !prev.lockExpiresAt) return prev;
        const now = Date.now();
        if (now >= prev.lockExpiresAt) {
          return { failedAttempts: 0, isLocked: false, lockExpiresAt: null, remainingSeconds: 0 };
        }
        return {
          ...prev,
          remainingSeconds: Math.ceil((prev.lockExpiresAt - now) / 1000),
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check connection initially
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Fetch or create user profile and enforce Single Device Lock
  const processUserProfile = useCallback(async (firebaseUser: User, simulatedDiffDevice = isSimulatingSecondDevice) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let profileData: UserProfile | null = null;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        profileData = snap.data() as UserProfile;
      } else {
        // First time sign-in (e.g., via Google)
        const now = new Date().toISOString();
        const baseProfile: UserProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'طالب جديد',
          email: firebaseUser.email || '',
          phone: '',
          governorate: 'القاهرة',
          activeDeviceId: '',
          hasConsentedWatermark: false,
          role: firebaseUser.email === 'cources01@gmail.com' ? 'admin' : 'student',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, baseProfile);
        profileData = baseProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }

    if (!profileData) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const currentDeviceId = simulatedDiffDevice 
      ? `SIM-SECOND-DEVICE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      : getOrCreateDeviceId();

    // 1. Device Lock Verification
    if (!profileData.activeDeviceId) {
      // First device registration: Lock this account to current device
      try {
        const now = new Date().toISOString();
        await updateDoc(userDocRef, {
          activeDeviceId: currentDeviceId,
          deviceLinkedAt: now,
          updatedAt: now,
        });
        profileData.activeDeviceId = currentDeviceId;
        profileData.deviceLinkedAt = now;
        setActiveDeviceMismatch(false);
        setMismatchedDeviceId(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    } else if (profileData.activeDeviceId !== currentDeviceId) {
      // Mismatch: Account is locked to a different device!
      setActiveDeviceMismatch(true);
      setMismatchedDeviceId(profileData.activeDeviceId);
    } else {
      // Device matches accurately
      setActiveDeviceMismatch(false);
      setMismatchedDeviceId(null);
    }

    // 2. Legal Watermark Consent check
    if (!profileData.hasConsentedWatermark) {
      setNeedsWatermarkConsent(true);
    } else {
      setNeedsWatermarkConsent(false);
    }

    setUserProfile(profileData);
    setLoading(false);
  }, [isSimulatingSecondDevice]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        await processUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setActiveDeviceMismatch(false);
        setMismatchedDeviceId(null);
        setNeedsWatermarkConsent(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [processUserProfile]);

  const refreshProfile = async () => {
    if (user) {
      await processUserProfile(user);
    }
  };

  // Login with Email & Password with 3-strike rate limiter
  const loginWithEmail = async (email: string, pass: string) => {
    const currentLimiter = getRateLimiterState(email);
    if (currentLimiter.isLocked) {
      setRateLimiter(currentLimiter);
      throw new Error(
        `تم تجاوز عدد محاولات الدخول المسموح بها (3 محاولات). تم إيقاف الحساب مؤقتاً لمدة 15 دقيقة لدواعي الأمان، أو يمكنك استعادة كلمة المرور عبر بريدك الإلكتروني.`
      );
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      resetFailedAttempts(email);
      setRateLimiter(getRateLimiterState(email));
      await processUserProfile(cred.user);
    } catch (err: unknown) {
      const newLimiter = recordFailedAttempt(email);
      setRateLimiter(newLimiter);

      if (newLimiter.isLocked) {
        throw new Error(
          `تم تجاوز عدد محاولات الدخول المسموح بها (3 محاولات). تم إيقاف الحساب مؤقتاً لمدة 15 دقيقة لدواعي الأمان، أو يمكنك استعادة كلمة المرور عبر بريدك الإلكتروني.`
        );
      }

      const remaining = 3 - newLimiter.failedAttempts;
      throw new Error(
        `بيانات تسجيل الدخول غير صحيحة. متبقي لديك ${remaining} محاولات قبل إيقاف الحساب مؤقتاً لمدة 15 دقيقة.`
      );
    }
  };

  // Register with Email
  const registerWithEmail = async (
    fullName: string,
    email: string,
    pass: string,
    phone: string,
    governorate: string
  ) => {
    const cleanEmail = email.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    await updateProfile(cred.user, { displayName: fullName.trim() });

    const currentDeviceId = getOrCreateDeviceId();
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: cred.user.uid,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      governorate,
      activeDeviceId: currentDeviceId,
      deviceLinkedAt: now,
      hasConsentedWatermark: false,
      role: cleanEmail === 'cources01@gmail.com' ? 'admin' : 'student',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
      setActiveDeviceMismatch(false);
      setNeedsWatermarkConsent(true);
      resetFailedAttempts(cleanEmail);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await processUserProfile(res.user);
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
      throw err;
    }
  };

  // Password reset email
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setActiveDeviceMismatch(false);
    setMismatchedDeviceId(null);
    setNeedsWatermarkConsent(false);
  };

  // Accept Watermark Legal Consent
  const acceptWatermarkConsent = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasConsentedWatermark: true,
        consentDate: now,
        updatedAt: now,
      });
      setUserProfile(prev => prev ? { ...prev, hasConsentedWatermark: true, consentDate: now } : null);
      setNeedsWatermarkConsent(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Reset Device Lock (Available for Admin or Student account self-reset if permitted)
  const resetDeviceLock = async (targetUid?: string) => {
    const uidToReset = targetUid || user?.uid;
    if (!uidToReset) return;

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'users', uidToReset), {
        activeDeviceId: '',
        deviceLinkedAt: '',
        updatedAt: now,
      });

      if (user && user.uid === uidToReset) {
        // Re-bind to current device immediately
        const currentDeviceId = getOrCreateDeviceId();
        await updateDoc(doc(db, 'users', user.uid), {
          activeDeviceId: currentDeviceId,
          deviceLinkedAt: now,
          updatedAt: now,
        });
        setActiveDeviceMismatch(false);
        setMismatchedDeviceId(null);
        setUserProfile(prev => prev ? { ...prev, activeDeviceId: currentDeviceId, deviceLinkedAt: now } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uidToReset}`);
    }
  };

  // Toggle simulation of a secondary device (for demo/testing device lock)
  const simulateSecondDevice = (enable: boolean) => {
    setIsSimulatingSecondDevice(enable);
    if (user) {
      processUserProfile(user, enable);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        deviceInfo,
        loading,
        activeDeviceMismatch,
        mismatchedDeviceId,
        needsWatermarkConsent,
        rateLimiter,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        logout,
        acceptWatermarkConsent,
        resetDeviceLock,
        simulateSecondDevice,
        isSimulatingSecondDevice,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
