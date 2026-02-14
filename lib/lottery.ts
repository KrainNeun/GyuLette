import { Participant, AppSettings, Slot } from '@/types';

/**
 * 参加者のスロット数を計算
 */
export const calculateSlotCount = (
  participant: Participant,
  settings: AppSettings
): number => {
  // 除外されている場合は0
  if (participant.isExcluded) {
    return 0;
  }

  // 基本スロット数
  let slotCount = settings.globalSlotCount;

  // 「当たってほしい!!」が有効な場合は倍率適用
  if (participant.isSpecial) {
    slotCount *= settings.specialMultiplier;
  }

  return slotCount;
};

/**
 * 抽選プールを作成
 */
export const createLotteryPool = (
  participants: Participant[],
  settings: AppSettings
): Slot[] => {
  const pool: Slot[] = [];

  participants.forEach((participant) => {
    const slotCount = calculateSlotCount(participant, settings);
    
    for (let i = 0; i < slotCount; i++) {
      pool.push({
        participantId: participant.id,
        participant,
      });
    }
  });

  return pool;
};

/**
 * ランダムに当選者を選択
 */
export const selectWinner = (pool: Slot[]): Slot | null => {
  if (pool.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

/**
 * 抽選を実行
 */
export const performLottery = (
  participants: Participant[],
  settings: AppSettings
): Participant | null => {
  const pool = createLotteryPool(participants, settings);
  const winner = selectWinner(pool);
  return winner?.participant || null;
};

/**
 * 除外されていない参加者を取得
 */
export const getEligibleParticipants = (
  participants: Participant[]
): Participant[] => {
  return participants.filter((p) => !p.isExcluded);
};
