export interface AudioSettings {
  masterVolume: number; // 0 to 1
  bgmVolume: number;    // 0 to 1
  sfxVolume: number;    // 0 to 1
  muted: boolean;
}

export interface SaveData {
  version: 1;
  started?: boolean;
  checkpoint?: { id: string; x: number; y: number } | null;
  currentStage: string;
  lives: number;
  totalStamps: number;
  postcards: string[]; // IDs like '1-1-1', '1-1-2', '1-1-3'
  unlockedStages: string[];
  bestTimes: Record<string, number>;
  highScores: Record<string, number>;
  audio: AudioSettings;
}

const SAVE_KEY = 'nilo.save.v1';

const DEFAULT_AUDIO: AudioSettings = {
  masterVolume: 0.8,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  muted: false,
};

const DEFAULT_SAVE: SaveData = {
  version: 1,
  currentStage: '1-1',
  lives: 3,
  totalStamps: 0,
  postcards: [],
  unlockedStages: ['1-1'],
  bestTimes: {},
  highScores: {},
  audio: DEFAULT_AUDIO,
};

export class SaveSystem {
  private static instance: SaveSystem;

  public static get(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  load(): SaveData {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };

    try {
      const parsed = JSON.parse(raw) as SaveData;
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        audio: { ...DEFAULT_AUDIO, ...(parsed.audio || {}) },
      };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  hasSave(): boolean {
    const data = this.load();
    return data.started === true || Object.keys(data.bestTimes).length > 0;
  }

  save(data: Partial<SaveData>): void {
    const current = this.load();
    const updated = { ...current, ...data };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
  }

  reset(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  recordStageClear(stageId: string, timeSeconds: number, score: number, postcardsFound: string[]): void {
    const current = this.load();
    const bestTime = current.bestTimes[stageId] ? Math.min(current.bestTimes[stageId], timeSeconds) : timeSeconds;
    const highScore = current.highScores[stageId] ? Math.max(current.highScores[stageId], score) : score;

    const mergedPostcards = Array.from(new Set([...current.postcards, ...postcardsFound]));
    const nextStages = new Set(current.unlockedStages);
    if (stageId === '1-1') nextStages.add('1-2');

    this.save({
      bestTimes: { ...current.bestTimes, [stageId]: bestTime },
      highScores: { ...current.highScores, [stageId]: highScore },
      postcards: mergedPostcards,
      unlockedStages: Array.from(nextStages),
    });
  }
}
