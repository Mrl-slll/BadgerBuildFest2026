import { useSyncExternalStore } from 'react';
import type { QuizResult } from './quiz-types';
import { getHealthStorageKey, parseStoredHealthData, saveHealthDataLocally } from './health-storage';
import { emptyData, scoped, type HealthData } from './health';

export function getQuizStorageKey(userId?: string | null): string {
  if (userId && userId !== 'local-user') {
    return `pcos-quiz:v1:${userId}`;
  }
  return 'pcos-quiz:v1:guest';
}

const QUIZ_UPDATE_EVENT = 'pcos-quiz-updated';

export function getStoredQuizResult(userId?: string | null): QuizResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getQuizStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as QuizResult;
      if (parsed && parsed.phenotype && parsed.primaryPillar) {
        return parsed;
      }
    }

    // Also fallback to check if embedded in health data
    const healthKey = getHealthStorageKey(userId);
    const healthRaw = localStorage.getItem(healthKey);
    if (healthRaw) {
      const parsedHealth = parseStoredHealthData(healthRaw, userId);
      if (parsedHealth.data?.quizResult) {
        return parsedHealth.data.quizResult;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function saveQuizResultLocally(result: QuizResult, userId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const key = getQuizStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(result));

    // Also attach to local health records
    const healthKey = getHealthStorageKey(userId);
    const healthRaw = localStorage.getItem(healthKey);
    const baseData = healthRaw ? parseStoredHealthData(healthRaw, userId).data : null;
    const updatedData: HealthData = {
      ...(baseData ?? emptyData(userId || 'local-user')),
      quizResult: result,
    };
    saveHealthDataLocally(updatedData, userId);

    window.dispatchEvent(new CustomEvent(QUIZ_UPDATE_EVENT, { detail: { userId, result } }));
  } catch (err) {
    console.error('[QuizStorage] Error saving quiz locally:', err);
  }
}

export async function syncQuizResultToCloud(result: QuizResult, userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !userId || userId === 'local-user') return false;

  try {
    // 1. Fetch current health data to avoid stomping logs
    const getRes = await fetch('/api/user-data');
    let currentData: HealthData = emptyData(userId);
    if (getRes.ok) {
      const payload = await getRes.json();
      if (payload?.data) {
        currentData = payload.data;
      }
    }

    // 2. Attach quizResult
    currentData.quizResult = result;
    currentData.user = { id: userId, name: currentData.user?.name || '' };

    // 3. Post back to /api/user-data
    const saveRes = await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: currentData }),
    });

    return saveRes.ok;
  } catch (err) {
    console.warn('[QuizStorage] Cloud sync skipped (offline or unconfigured):', err);
    return false;
  }
}

export function clearQuizResult(userId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const key = getQuizStorageKey(userId);
    localStorage.removeItem(key);

    const healthKey = getHealthStorageKey(userId);
    const healthRaw = localStorage.getItem(healthKey);
    if (healthRaw) {
      const parsedHealth = parseStoredHealthData(healthRaw, userId);
      if (parsedHealth.data) {
        delete parsedHealth.data.quizResult;
        saveHealthDataLocally(parsedHealth.data, userId);
      }
    }

    window.dispatchEvent(new CustomEvent(QUIZ_UPDATE_EVENT, { detail: { userId, result: null } }));
  } catch (err) {
    console.error('[QuizStorage] Error clearing quiz:', err);
  }
}

// React hook using useSyncExternalStore for reactive, zero-flicker updates
export function useStoredQuizResult(userId?: string | null): QuizResult | null {
  const subscribe = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const handleUpdate = () => callback();
    window.addEventListener(QUIZ_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(QUIZ_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  };

  const getSnapshot = () => {
    return JSON.stringify(getStoredQuizResult(userId));
  };

  const getServerSnapshot = () => null;

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizResult;
  } catch {
    return null;
  }
}
