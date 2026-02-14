import React, { useState, useEffect, useCallback } from 'react';
import { Participant, AppState } from '@/types';
import { RouletteWheel } from '@/components/RouletteWheel';
import { WinnerModal } from '@/components/WinnerModal';
import {
  loadState,
  saveState,
  generatePastelColor,
  generateId,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { performLottery, getEligibleParticipants } from '@/lib/lottery';
import { createWheelSegments, calculateFinalRotation } from '@/lib/wheel';

export default function Home() {
  
  const [state, setState] = useState<AppState>({
    version: 1,
    participants: [],
    settings: DEFAULT_SETTINGS,
  });
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);

  // 初期ロード
  useEffect(() => {
    // まずLocalStorageから既存の状態を読み込み
    const loaded = loadState();

    // クエリパラメータを直接取得（静的エクスポート対応）
    const urlParams = new URLSearchParams(window.location.search);
    const participantsParam = urlParams.get('participants');
    
    if (participantsParam) {
      // カンマ区切りで名前を分割
      const names = participantsParam
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      // 参加者を作成
      const newParticipants: Participant[] = names.map(name => ({
        id: generateId(),
        name,
        color: generatePastelColor(),
        isExcluded: false,
        isSpecial: false,
      }));
      
      // 参加者リストだけを上書き、設定は既存のものを保持
      const newState: AppState = {
        ...loaded,
        participants: newParticipants,
      };
      saveState(newState);
      setState(newState);
    } else {
      // クエリパラメータがない場合は通常通りLocalStorageから読み込み
      setState(loaded);
    }
    setIsInitialized(true);
  }, []);

  // 状態変更時に自動保存（初期化完了後のみ）
  useEffect(() => {
    if (isInitialized) {
      saveState(state);
    }
  }, [state, isInitialized]);

  // ホイールセグメントを計算
  const wheelSegments = createWheelSegments(state.participants, state.settings);
  const eligibleParticipants = getEligibleParticipants(state.participants);

  // 当選者を最新の状態から取得
  const winner = winnerId 
    ? state.participants.find(p => p.id === winnerId) || null
    : null;

  // 参加者追加
  const handleAddParticipant = () => {
    const trimmedName = newParticipantName.trim();
    if (!trimmedName) return;

    const newParticipant: Participant = {
      id: generateId(),
      name: trimmedName,
      color: generatePastelColor(),
      isExcluded: false,
      isSpecial: false,
    };

    setState((prev) => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
    }));
    setNewParticipantName('');
  };

  // 参加者削除
  const handleDeleteParticipant = (id: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
  };

  // 除外トグル
  const handleToggleExclude = (id: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === id ? { ...p, isExcluded: !p.isExcluded } : p
      ),
    }));
  };

  // 「当たってほしい!!」トグル
  const handleToggleSpecial = (id: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === id ? { ...p, isSpecial: !p.isSpecial } : p
      ),
    }));
  };

  // ルーレット実行
  const handleSpin = useCallback(() => {
    if (isSpinning || eligibleParticipants.length === 0) return;

    setIsSpinning(true);
    setShowModal(false);
    setWinnerId(null);

    // 当選者を決定
    const selectedWinner = performLottery(state.participants, state.settings);
    if (!selectedWinner) {
      setIsSpinning(false);
      return;
    }

    // 最終回転角度を計算
    const finalRotation = calculateFinalRotation(wheelSegments, selectedWinner.id);

    // スピン開始
    const spinDuration = state.settings.spinDuration;

    // 回転アニメーション
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // イージング(減速カーブ)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setRotation(finalRotation * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // ルーレット完全停止後、モーダルを表示
        setIsSpinning(false);
        setWinnerId(selectedWinner.id);
        setShowModal(true);
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, eligibleParticipants, state, wheelSegments]);

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // スピン可能かチェック
  const canSpin = eligibleParticipants.length > 0 && !isSpinning;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-[500px] mx-auto">
        {/* ヘッダー */}
        <header className="text-center py-4">
          <img 
            src="gyulette-logo.png"
            alt="ぎゅ~れっと" 
            className="mx-auto w-1/2 h-auto"
          />
        </header>

        {/* 縦1列レイアウト */}
        <div className="flex flex-col gap-4">
            {/* 参加者管理 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1">
              {/* アコーディオンヘッダー */}
              <button
                onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">参加者管理</h2>
                  <span className="text-sm text-gray-600">({state.participants.length}人 / 抽選対象: {eligibleParticipants.length}人)</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-6 h-6 transition-transform duration-200 ${isParticipantsOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* アコーディオンコンテンツ */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isParticipantsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6">
                  {/* 参加者追加 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">参加者追加</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                        placeholder="名前を入力"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddParticipant}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        追加
                      </button>
                    </div>
                  </div>

                  {/* 参加者リスト */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">参加者リスト</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {state.participants.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">参加者がいません</p>
                  ) : (
                    state.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        style={{ backgroundColor: participant.color + '30' }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: participant.color }}
                        />
                        <span className="flex-1 font-medium text-gray-800 truncate">
                          {participant.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* 除外トグル */}
                          <button
                            onClick={() => handleToggleExclude(participant.id)}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                              focus:outline-none focus:ring-2 focus:ring-offset-1
                              ${
                                participant.isExcluded
                                  ? 'bg-red-500 focus:ring-red-400'
                                  : 'bg-green-500 focus:ring-green-400'
                              }
                            `}
                            title={participant.isExcluded ? '除外中' : '抽選対象'}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow
                                ${participant.isExcluded ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>
                          {/* 当たってほしい!!トグル */}
                          <button
                            onClick={() => handleToggleSpecial(participant.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              participant.isSpecial
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                            }`}
                            title="当選確率UP設定"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                          {/* 削除ボタン */}
                          <button
                            onClick={() => handleDeleteParticipant(participant.id)}
                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="削除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 設定 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* アコーディオンヘッダー */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-bold text-gray-800">設定</h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-6 h-6 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              
              {/* アコーディオンコンテンツ */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isSettingsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 space-y-6">
                  {/* グローバルスロット数 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      基本スロット数: {state.settings.globalSlotCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={state.settings.globalSlotCount}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            globalSlotCount: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* スピン時間 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      スピン時間: {(state.settings.spinDuration / 1000).toFixed(1)}秒
                    </label>
                    <input
                      type="range"
                      min="2000"
                      max="4000"
                      step="100"
                      value={state.settings.spinDuration}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            spinDuration: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* 当たってほしい!!倍率 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⭐倍率: {state.settings.specialMultiplier}倍
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={state.settings.specialMultiplier}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            specialMultiplier: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* ルーレット */}
          <div className="relative rounded-xl py-4 overflow-hidden">
            {/* コンテンツ */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {/* ルーレットホイール */}
              <div className="relative w-full px-4">
                {wheelSegments.length > 0 ? (
                  <RouletteWheel
                    segments={wheelSegments}
                    rotation={rotation}
                    isSpinning={isSpinning}
                  />
                ) : (
                  <div className="w-full aspect-square max-w-[350px] mx-auto flex items-center justify-center border-4 border-dashed border-gray-300 rounded-full">
                    <p className="text-gray-500 text-center px-6">
                      参加者を追加してください
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* スピンボタン */}
          <div className="rounded-xl py-4">
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={handleSpin}
                disabled={!canSpin}
                className={`w-full max-w-[300px] py-4 text-xl font-bold rounded-full transition-all transform ${
                  canSpin
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSpinning ? '抽選中...' : 'スピン!'}
              </button>

              {/* 警告メッセージ */}
              {state.participants.length === 0 && (
                <p className="mt-4 text-red-600 font-semibold text-center">
                  ⚠️ 参加者がいません
                </p>
              )}
              {state.participants.length > 0 && eligibleParticipants.length === 0 && (
                <p className="mt-4 text-red-600 font-semibold text-center">
                  ⚠️ 全員が除外されています
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 当選モーダル */}
      {winner && (
        <WinnerModal
          winner={winner}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
