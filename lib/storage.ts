import { AppState, AppSettings } from '@/types';

const STORAGE_KEY = 'roulette_app_state_v1';

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: AppSettings = {
  globalSlotCount: 1,
  spinDuration: 2800,
  specialMultiplier: 3,
};

/**
 * デフォルト状態
 */
const DEFAULT_STATE: AppState = {
  version: 1,
  participants: [],
  settings: DEFAULT_SETTINGS,
};

/**
 * LocalStorageから状態を読み込む
 */
export const loadState = (): AppState => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(stored) as AppState;
    
    // バージョンチェック
    if (parsed.version !== 1) {
      console.warn('Unsupported state version, using default');
      return DEFAULT_STATE;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load state:', error);
    return DEFAULT_STATE;
  }
};

/**
 * LocalStorageに状態を保存する
 */
export const saveState = (state: AppState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

/**
 * パステルカラーをランダム生成
 */
export const generatePastelColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.random() * 20; // 60-80%
  const lightness = 75 + Math.random() * 10; // 75-85%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * ユニークIDを生成
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
