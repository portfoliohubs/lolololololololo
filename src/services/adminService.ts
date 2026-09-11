import { auth, db } from '../firebase/config';
import { doc, getDoc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { AdminCommandResult, UserProfile, SubscriptionStatus } from '../types';

export const adminService = {
  /**
   * Central command dispatcher
   */
  async executeAdminCommand(
    action: 'setUnlockedUnits' | 'setSubscription' | 'resetDevice' | 'setSuspended',
    targetUserId: string,
    values: Record<string, any>,
    reason = 'إجراء إداري معتمد'
  ): Promise<AdminCommandResult> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { ok: false, code: 'NOT_AUTHENTICATED', message: 'يرجى تسجيل الدخول أولاً كمسؤول أو مساعد.' };
    }

    const token = await currentUser.getIdToken();

    try {
      const res = await fetch('/api/admin/execute-command', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          targetUserId,
          values,
          reason
        })
      });

      const data: AdminCommandResult = await res.json();
      if (!res.ok || !data.ok) {
        console.error('[AdminService] Operation failed:', data);
        return {
          ok: false,
          code: data.code || 'COMMAND_FAILED',
          message: data.message || 'فشلت العملية الإدارية.'
        };
      }

      return data;
    } catch (apiErr) {
      console.warn('[AdminService] API route unavailable, executing direct Firestore transaction:', apiErr);

      // Fallback: direct Firestore transaction
      try {
        const userRef = doc(db, 'users', targetUserId);
        const executorDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const executorRole = executorDoc.data()?.role || 'student';

        if (executorRole !== 'admin' && executorRole !== 'assistant') {
          return { ok: false, code: 'FORBIDDEN', message: 'ليس لديك صلاحيات إدارية كافية.' };
        }

        const result = await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error('المستند غير موجود');
          }
          const prevData = userSnap.data();

          const updates: Record<string, any> = {
            updatedAt: new Date().toISOString()
          };

          if (action === 'setUnlockedUnits') {
            const units = Array.isArray(values.unlockedUnits) ? values.unlockedUnits.map(Number) : [];
            updates.unlockedUnits = units;
            if (units.length > 0 && prevData.subscriptionStatus !== 'active') {
              updates.subscriptionStatus = 'active';
            }
          } else if (action === 'setSubscription') {
            updates.subscriptionStatus = values.subscriptionStatus || 'active';
            if (values.packageId) updates.packageId = values.packageId;
            if (values.subscriptionExpiresAt) updates.subscriptionExpiresAt = values.subscriptionExpiresAt;
          } else if (action === 'resetDevice') {
            updates.activeDeviceId = null;
          } else if (action === 'setSuspended') {
            if (executorRole !== 'admin') throw new Error('مقتصر على المشرف');
            updates.suspended = Boolean(values.suspended);
          }

          transaction.update(userRef, updates);

          // Write audit log
          const auditRef = doc(collection(db, 'audit_logs'));
          transaction.set(auditRef, {
            executorUid: currentUser.uid,
            executorEmail: currentUser.email || '',
            executorRole,
            targetUserId,
            action,
            previousValues: prevData,
            newValues: updates,
            timestamp: new Date().toISOString(),
            reason
          });

          return updates;
        });

        // Re-read document to verify
        const reReadSnap = await getDoc(userRef);
        const reReadData = reReadSnap.data() as UserProfile;

        return {
          ok: true,
          userId: targetUserId,
          updatedFields: result,
          updatedAt: new Date().toISOString(),
          docFields: reReadData
        };
      } catch (transErr: any) {
        return {
          ok: false,
          code: 'TRANSACTION_FAILED',
          message: transErr.message || 'فشلت العملية أثناء المعاملة البنكية.'
        };
      }
    }
  },

  /**
   * Set student unlocked units (numbers only e.g. [1, 2])
   */
  async setUnlockedUnits(targetUserId: string, units: number[], reason?: string): Promise<AdminCommandResult> {
    const validUnits = Array.from(new Set(units.map(Number))).filter(n => !isNaN(n) && n >= 1 && n <= 7).sort((a, b) => a - b);
    return this.executeAdminCommand('setUnlockedUnits', targetUserId, { unlockedUnits: validUnits }, reason);
  },

  /**
   * Set student subscription status
   */
  async setSubscription(
    targetUserId: string,
    status: SubscriptionStatus,
    packageId?: string,
    subscriptionExpiresAt?: string,
    reason?: string
  ): Promise<AdminCommandResult> {
    return this.executeAdminCommand('setSubscription', targetUserId, {
      subscriptionStatus: status,
      packageId,
      subscriptionExpiresAt
    }, reason);
  },

  /**
   * Reset student single-device lock
   */
  async resetStudentDevice(targetUserId: string, reason?: string): Promise<AdminCommandResult> {
    return this.executeAdminCommand('resetDevice', targetUserId, {}, reason || 'طلب فك ارتباط جهاز الطالب');
  },

  async resetDevice(targetUserId: string, reason?: string): Promise<AdminCommandResult> {
    return this.resetStudentDevice(targetUserId, reason);
  },

  /**
   * Suspend or unsuspend student
   */
  async setStudentSuspended(targetUserId: string, suspended: boolean, reason?: string): Promise<AdminCommandResult> {
    return this.executeAdminCommand('setSuspended', targetUserId, { suspended }, reason);
  },

  async suspendStudent(targetUserId: string, reason?: string): Promise<AdminCommandResult> {
    return this.setStudentSuspended(targetUserId, true, reason || 'تجميد الحساب من قبل الإدارة');
  },

  async reactivateStudent(targetUserId: string, reason?: string): Promise<AdminCommandResult> {
    return this.setStudentSuspended(targetUserId, false, reason || 'إلغاء تجميد الحساب');
  },

  async updateStudentSubscription(
    targetUserId: string,
    params: {
      unlockedUnits?: number[];
      subscriptionStatus?: SubscriptionStatus;
      packageId?: string;
      subscriptionExpiresAt?: string;
    },
    reason?: string
  ): Promise<AdminCommandResult> {
    return this.setStudentAccess(targetUserId, params, reason);
  },

  /**
   * Comprehensive Student Access Setter
   */
  async setStudentAccess(
    targetUserId: string,
    params: {
      unlockedUnits?: number[];
      subscriptionStatus?: SubscriptionStatus;
      packageId?: string;
      subscriptionExpiresAt?: string;
      resetDevice?: boolean;
      suspended?: boolean;
    },
    reason = 'تحديث شامل لبيانات الطالب'
  ): Promise<AdminCommandResult> {
    if (params.unlockedUnits !== undefined) {
      const res = await this.setUnlockedUnits(targetUserId, params.unlockedUnits, reason);
      if (!res.ok) return res;
    }
    if (params.subscriptionStatus !== undefined) {
      const res = await this.setSubscription(targetUserId, params.subscriptionStatus, params.packageId, params.subscriptionExpiresAt, reason);
      if (!res.ok) return res;
    }
    if (params.resetDevice) {
      const res = await this.resetStudentDevice(targetUserId, reason);
      if (!res.ok) return res;
    }
    if (params.suspended !== undefined) {
      const res = await this.setStudentSuspended(targetUserId, params.suspended, reason);
      if (!res.ok) return res;
    }
    return { ok: true, userId: targetUserId, updatedAt: new Date().toISOString() };
  }
};
