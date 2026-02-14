import React from 'react';
import { Participant } from '@/types';

interface WinnerModalProps {
  winner: Participant;
  isOpen: boolean;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-modal-in">
        <div className="text-center">
          {/* タイトル */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 当選者 🎉</h2>
          </div>

          {/* 当選者名 */}
          <div
            className="mb-6 p-6 rounded-xl"
            style={{ backgroundColor: winner.color }}
          >
            <p className="text-4xl font-bold text-gray-900">{winner.name}</p>
          </div>

          {/* クリックで閉じるヒント */}
          <p className="text-sm text-gray-500">クリックで閉じる</p>
        </div>
      </div>
    </div>
  );
};
