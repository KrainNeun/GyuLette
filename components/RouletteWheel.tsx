import React, { useRef, useEffect } from 'react';
import { WheelSegment } from '@/lib/wheel';

interface RouletteWheelProps {
  segments: WheelSegment[];
  rotation: number;
  isSpinning: boolean;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  segments,
  rotation,
  isSpinning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 500;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Canvasをクリア
    ctx.clearRect(0, 0, size, size);

    // 回転を適用
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // 連続する同じ参加者のセグメントを結合
    const mergedSegments: Array<{
      participant: typeof segments[0]['participant'];
      startAngle: number;
      endAngle: number;
    }> = [];

    segments.forEach((segment, index) => {
      if (index === 0) {
        // 最初のセグメント
        mergedSegments.push({
          participant: segment.participant,
          startAngle: segment.startAngle,
          endAngle: segment.endAngle,
        });
      } else {
        const lastMerged = mergedSegments[mergedSegments.length - 1];
        // 同じ参加者かどうかチェック
        if (lastMerged.participant.id === segment.participant.id) {
          // 結合：endAngleを更新
          lastMerged.endAngle = segment.endAngle;
        } else {
          // 新しいセグメント
          mergedSegments.push({
            participant: segment.participant,
            startAngle: segment.startAngle,
            endAngle: segment.endAngle,
          });
        }
      }
    });

    // 結合されたセグメントを描画
    mergedSegments.forEach((segment) => {
      const startAngle = (segment.startAngle * Math.PI) / 180;
      const endAngle = (segment.endAngle * Math.PI) / 180;

      // セグメントの扇形を描画
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.participant.color;
      ctx.fill();

      // 境界線
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // テキストを描画
      ctx.save();
      ctx.translate(centerX, centerY);
      const midAngle = (startAngle + endAngle) / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif';
      
      const textX = radius * 0.5;
      const name = segment.participant.name;
      const maxWidth = radius * 0.4;
      
      // テキストを切り詰め
      let displayName = name;
      if (ctx.measureText(name).width > maxWidth) {
        displayName = name.slice(0, 8) + '...';
      }
      
      ctx.fillText(displayName, textX, 0);
      ctx.restore();
    });

    ctx.restore();

    // 中央の円
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 外枠
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [segments, rotation]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className={`transition-opacity ${isSpinning ? 'opacity-90' : 'opacity-100'}`}
      />
      {/* ポインター（12時の位置） */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-500 drop-shadow-lg" />
      </div>
    </div>
  );
};
