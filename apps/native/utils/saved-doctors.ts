'use client';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const SAVED_DOCTORS_KEY = "saved_doctors";

async function getSavedIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_DOCTORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function persistSavedIds(ids: string[]) {
  await AsyncStorage.setItem(SAVED_DOCTORS_KEY, JSON.stringify(ids));
}

export function useIsDoctorSaved(doctorId: string) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    getSavedIds().then(setSavedIds);
  }, []);

  const toggleSave = useCallback(async () => {
    const current = await getSavedIds();
    const next = current.includes(doctorId)
      ? current.filter((id) => id !== doctorId)
      : [...current, doctorId];
    setSavedIds(next);
    await persistSavedIds(next);
  }, [doctorId]);

  return {
    isSaved: savedIds.includes(doctorId),
    toggleSave,
  };
}
