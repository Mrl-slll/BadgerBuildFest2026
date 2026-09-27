import { scoped, type HealthData } from "./health";
import {
  validateDaily,
  validateLab,
  validateMedication,
} from "./tracking-validation";
import { sampleHealthData } from "./sample-data";

export const healthStorageKey = "pcos-tracking:v1";

export function parseStoredHealthData(raw: string | null): {
  data: HealthData | null;
  invalid: boolean;
} {
  if (!raw) return { data: null, invalid: false };

  try {
    const parsed = JSON.parse(raw) as HealthData;
    if (
      parsed.version !== 1 ||
      !parsed.user?.id ||
      !Array.isArray(parsed.logs) ||
      !Array.isArray(parsed.medications) ||
      !Array.isArray(parsed.labs) ||
      parsed.logs.some((log) => validateDaily(log)) ||
      parsed.medications.some((medication) => validateMedication(medication)) ||
      parsed.labs.some((lab) => validateLab(lab))
    ) {
      throw new Error("Invalid stored health data");
    }

    return { data: scoped(parsed), invalid: false };
  } catch {
    return { data: null, invalid: true };
  }
}

export function getInitialOrStoredHealthData(): HealthData {
  if (typeof window === "undefined") {
    return sampleHealthData;
  }
  try {
    const raw = localStorage.getItem(healthStorageKey);
    if (!raw) {
      localStorage.setItem(healthStorageKey, JSON.stringify(sampleHealthData));
      return sampleHealthData;
    }
    const parsed = parseStoredHealthData(raw);
    return parsed.data ?? sampleHealthData;
  } catch {
    return sampleHealthData;
  }
}

