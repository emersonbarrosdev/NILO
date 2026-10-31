export interface SaveData {
  version: 1;
  currentStage: string;
  lives: number;
  postcards: string[];
  bestTimes: Record<string, number>;
}

const SAVE_KEY = 'nilo.save.v1';
const LEGACY_SAVE_KEY = 'estalo88.save.v1';

export class SaveSystem {
  load(): SaveData | null {
    const current = localStorage.getItem(SAVE_KEY);
    if (current) {
      try { return JSON.parse(current) as SaveData; } catch { return null; }
    }

    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return null;

    try {
      const data = JSON.parse(legacy) as SaveData;
      localStorage.setItem(SAVE_KEY, legacy);
      localStorage.removeItem(LEGACY_SAVE_KEY);
      return data;
    } catch {
      return null;
    }
  }

  save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }
}
