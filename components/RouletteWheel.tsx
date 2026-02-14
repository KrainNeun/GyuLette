import React, { useRef, useEffect, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // 描画関数を分離
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // コンテナのサイズを取得
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth, 400); // 最大400px
    
    // サイズが0の場合は描画しない
    if (size === 0) return;
    
    // Canvasの実際のサイズを設定
    canvas.width = size;
    canvas.height = size;
    
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
      const fontSize = Math.max(12, size * 0.032); // サイズに応じてフォントサイズを調整
      ctx.font = `bold ${fontSize}px sans-serif`;
      
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
    const centerCircleRadius = size * 0.06; // サイズに応じて調整
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
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

  // 初回描画と更新時の描画
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // ウィンドウリサイズ時に再描画
  useEffect(() => {
    const handleResize = () => {
      drawWheel();
    };
    
    window.addEventListener('resize', handleResize);
    // 初回マウント時にも実行
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className={`w-full h-auto transition-opacity ${isSpinning ? 'opacity-90' : 'opacity-100'}`}
      />
      {/* ポインター（12時の位置） */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-lg" />
      </div>
    </div>
  );
};
