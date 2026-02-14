import { Participant, AppSettings } from '@/types';
import { calculateSlotCount } from './lottery';

/**
 * ホイールセクター型
 */
export interface WheelSegment {
  participant: Participant;
  startAngle: number;
  endAngle: number;
  slotCount: number;
}

/**
 * ホイールセグメントを作成
 * リスト順に表示し、⭐がついている人は連続で表示
 */
export const createWheelSegments = (
  participants: Participant[],
  settings: AppSettings
): WheelSegment[] => {
  // 各参加者のスロット数を計算
  const participantSlots = participants.map((p) => ({
    participant: p,
    slotCount: calculateSlotCount(p, settings),
  }));

  // 総スロット数を計算
  const totalSlots = participantSlots.reduce(
    (sum, item) => sum + item.slotCount,
    0
  );

  if (totalSlots === 0) {
    return [];
  }

  // スロットプールを作成（基本スロット数分だけリストを繰り返す）
  const slotPool: Participant[] = [];
  
  // 基本スロット数だけ繰り返す
  for (let round = 0; round < settings.globalSlotCount; round++) {
    participantSlots.forEach((item) => {
      if (item.slotCount > 0) {
        // 除外されていない場合
        if (item.participant.isSpecial) {
          // ⭐がついている場合は倍率分だけ連続で追加
          for (let i = 0; i < settings.specialMultiplier; i++) {
            slotPool.push(item.participant);
          }
        } else {
          // ⭐がついていない場合は1回だけ追加
          slotPool.push(item.participant);
        }
      }
    });
  }

  // スロットから等分セグメントを作成
  const segments: WheelSegment[] = [];
  const anglePerSlot = 360 / slotPool.length;
  
  slotPool.forEach((participant, index) => {
    const startAngle = anglePerSlot * index;
    segments.push({
      participant,
      startAngle,
      endAngle: startAngle + anglePerSlot,
      slotCount: 1,
    });
  });

  return segments;
};

/**
 * 指定した参加者のセグメント角度を取得（ランダムに選択）
 */
export const getSegmentAngleForParticipant = (
  segments: WheelSegment[],
  participantId: string
): number => {
  // その参加者の全セグメントを取得
  const participantSegments = segments.filter((s) => s.participant.id === participantId);
  if (participantSegments.length === 0) {
    return 0;
  }

  // ランダムに1つのセグメントを選択
  const randomSegment = participantSegments[Math.floor(Math.random() * participantSegments.length)];
  
  // セグメントの中央角度を返す
  return (randomSegment.startAngle + randomSegment.endAngle) / 2;
};

/**
 * スピン後の最終回転角度を計算
 */
export const calculateFinalRotation = (
  segments: WheelSegment[],
  winnerParticipantId: string
): number => {
  const targetAngle = getSegmentAngleForParticipant(segments, winnerParticipantId);
  
  // 少なくとも3回転 + ターゲット角度
  const minRotations = 3;
  const extraRotation = minRotations * 360;
  
  // 12時の方向（上）に来るように調整（-90度オフセット）
  // ホイールは時計回りに回転するので、逆方向の角度を計算
  const finalAngle = extraRotation + (360 - targetAngle) - 90;
  
  return finalAngle;
};
