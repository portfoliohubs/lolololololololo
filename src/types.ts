export type UserRole = 'student' | 'admin' | 'assistant';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  governorate?: string;
  activeDeviceId?: string;
  deviceLinkedAt?: string;
  hasConsentedWatermark?: boolean;
  consentDate?: string;
  role?: UserRole;
  unlockedUnits?: number[];
  unlockedLessons?: string[];
  activePackageId?: string;
  packageStatus?: 'active' | 'pending' | 'locked';
  isSuspended?: boolean;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonMeta {
  id: string; // e.g. "unit_1/lesson_1_1"
  unitNumber: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  questionsCount: number;
  flashcardsCount: number;
  videoUrl?: string;
  isFreePreview?: boolean;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  priceEGP: number;
  description: string;
  features: string[];
  badge?: string;
  unlockedUnits: number[];
  isPopular?: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  browser: string;
  os: string;
  screenResolution: string;
  timestamp: number;
}

export interface RateLimiterState {
  failedAttempts: number;
  isLocked: boolean;
  lockExpiresAt: number | null;
  remainingSeconds: number;
}

export const EGYPTIAN_GOVERNORATES: string[] = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحر الأحمر',
  'البحيرة',
  'الفيوم',
  'الغربية',
  'الإسماعيلية',
  'المنوفية',
  'المنيا',
  'القليوبية',
  'الوادي الجديد',
  'السويس',
  'أسوان',
  'أسيوط',
  'بني سويف',
  'بورسعيد',
  'دمياط',
  'الشرقية',
  'جنوب سيناء',
  'كفر الشيخ',
  'مطروح',
  'الأقصر',
  'قنا',
  'شمال سيناء',
  'سوهاج'
];

export interface CurriculumStation {
  id: number;
  stationNumber: number;
  title: string;
  subtitle: string;
  type: 'index' | 'unit' | 'revision' | 'mega_exam';
  unitNumber?: number;
  lessonsCount?: number;
  questionsCount?: number;
  flashcardsCount?: number;
  status: 'available' | 'in_progress' | 'locked';
  tags: string[];
  description: string;
}
