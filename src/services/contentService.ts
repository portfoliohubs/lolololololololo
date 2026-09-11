import { auth } from '../firebase/config';
import type { NormalizedQuestion, NormalizedFlashcard } from '../types';

export interface ContentAccessError {
  isAccessDenied: true;
  code: 'AUTH_FAILED' | 'SUBSCRIPTION_INACTIVE' | 'UNIT_LOCKED' | 'ACCOUNT_SUSPENDED' | 'FILE_NOT_FOUND' | 'NETWORK_ERROR';
  message: string;
}

async function getAuthHeader(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`
  };
}

export const contentService = {
  /**
   * Fetch lesson content markdown (student_content.md)
   */
  async getLessonContent(lessonId: string, filename = 'student_content.md'): Promise<string> {
    const headers = await getAuthHeader();
    const parts = lessonId.split('/');
    if (parts.length !== 2) throw new Error('Invalid lesson identifier structure');
    const [unitId, lId] = parts;

    const res = await fetch(`/api/content/lessons/${unitId}/${lId}/${filename}`, { headers });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || (
        res.status === 401 ? 'يرجى تسجيل الدخول أولاً للوصول للمحتوى.' :
        res.status === 403 ? 'هذا المحتوى يتطلب اشتراكاً مفعلاً ووحدة مفتوحة.' :
        'تعذر تحميل الدرس المطلوب.'
      );
      const error: any = new Error(message);
      error.isAccessDenied = true;
      error.code = errData.code || 'ACCESS_DENIED';
      throw error;
    }

    return await res.text();
  },

  /**
   * Fetch 100 questions for a lesson
   */
  async getLessonQuestions(lessonId: string): Promise<NormalizedQuestion[]> {
    const headers = await getAuthHeader();
    const parts = lessonId.split('/');
    const [unitId, lId] = parts;

    const res = await fetch(`/api/content/lessons/${unitId}/${lId}/questions.json`, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || 'تعذر تحميل بنك الأسئلة لهذا الدرس.';
      const error: any = new Error(message);
      error.isAccessDenied = true;
      error.code = errData.code || 'ACCESS_DENIED';
      throw error;
    }

    return await res.json();
  },

  /**
   * Fetch 20 flashcards for a lesson
   */
  async getLessonFlashcards(lessonId: string): Promise<NormalizedFlashcard[]> {
    const headers = await getAuthHeader();
    const parts = lessonId.split('/');
    const [unitId, lId] = parts;

    const res = await fetch(`/api/content/lessons/${unitId}/${lId}/flashcards.json`, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || 'تعذر تحميل بطاقات الاسترجاع لهذا الدرس.';
      const error: any = new Error(message);
      error.isAccessDenied = true;
      error.code = errData.code || 'ACCESS_DENIED';
      throw error;
    }

    return await res.json();
  },

  /**
   * Fetch Unit A4 Summary Capsule
   */
  async getUnitCapsule(unitNumber: number): Promise<string> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/content/unit-capsule/${unitNumber}`, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || `تعذر تحميل كبسولة مراجعة الوحدة ${unitNumber}.`;
      const error: any = new Error(message);
      error.isAccessDenied = true;
      error.code = errData.code || 'ACCESS_DENIED';
      throw error;
    }

    return await res.text();
  },

  /**
   * Fetch 5 Final Mock Exams (250 questions)
   */
  async getFinalMockExams(): Promise<any[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/content/final-exams`, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.message || 'تعذر تحميل الامتحانات الشاملة.';
      const error: any = new Error(message);
      error.isAccessDenied = true;
      error.code = errData.code || 'ACCESS_DENIED';
      throw error;
    }

    return await res.json();
  }
};
