export interface SaveData {
  version: 1;
  currentStage: string;
  lives: number;
  postcards: string[];
  bestTimes: Record<string, number>;
}

const SAVE_KEY = 'nilo.save.v1';

export class SaveSystem {
  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }
}
