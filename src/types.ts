export type UserRole = 'student' | 'admin' | 'assistant';
export type SubscriptionStatus = 'inactive' | 'active' | 'expired' | 'suspended';

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
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  packageId?: string;
  subscriptionExpiresAt?: string;
  unlockedUnits: number[];
  unlockedLessons?: string[];
  suspended: boolean;
  isSuspended?: boolean; // legacy alias
  activePackageId?: string; // legacy alias
  packageStatus?: 'active' | 'pending' | 'locked'; // legacy alias
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCommandResult {
  ok: boolean;
  userId?: string;
  updatedFields?: Partial<UserProfile>;
  updatedAt?: string;
  code?: string;
  message?: string;
  docFields?: any;
}

export interface AuditLogEntry {
  id?: string;
  executorUid: string;
  executorEmail?: string;
  executorRole: UserRole;
  targetUserId: string;
  targetUserEmail?: string;
  action: string;
  newValuesJson?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
  reason?: string;
}

export interface NormalizedQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  ministerialRef?: string;
  difficulty?: string;
  concept?: string;
}

export interface NormalizedFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  category?: string;
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
