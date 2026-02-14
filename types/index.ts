/**
 * 参加者データ型
 */
export interface Participant {
  id: string;
  name: string;
  color: string;
  isExcluded: boolean;
  isSpecial: boolean; // 「当たってほしい!!」設定
}

/**
 * アプリケーション設定型
 */
export interface AppSettings {
  globalSlotCount: number; // 1-5
  spinDuration: number; // 2-4秒（ミリ秒）
  specialMultiplier: number; // 2-10倍
}

/**
 * アプリケーション状態型
 */
export interface AppState {
  version: number;
  participants: Participant[];
  settings: AppSettings;
}

/**
 * 抽選用スロット型
 */
export interface Slot {
  participantId: string;
  participant: Participant;
}
