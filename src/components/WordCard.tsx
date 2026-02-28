import { useAuth } from '@/hooks/useAuth';
import { Check, Star, Volume2, X } from 'lucide-react';
import type { Word } from '@/types';

interface WordCardProps {
  word: Word;
  onClose: () => void;
  position: { x: number; y: number };
}

export function WordCard({ word, onClose, position }: WordCardProps) {
  const { isWordMastered, isWordFavorite, toggleMasteredWord, toggleFavoriteWord } = useAuth();
  
  const mastered = isWordMastered(word.text);
  const favorite = isWordFavorite(word.text);

  // 调整位置确保卡片不超出视口
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 370),
    y: position.y > window.innerHeight / 2 ? position.y - 280 : position.y + 20,
  };

  return (
    <div
      className="word-popup"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">{word.text}</h3>
          <button
            onClick={() => {
              // 播放发音（模拟）
              const utterance = new SpeechSynthesisUtterance(word.text);
              utterance.lang = 'en-US';
              speechSynthesis.speak(utterance);
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="播放发音"
          >
            <Volume2 className="w-4 h-4 text-blue-500" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* 音标 */}
      <div className="mb-3">
        <span className="text-sm text-gray-500 font-mono">{word.phonetic}</span>
      </div>

      {/* 释义 */}
      <div className="mb-4">
        <p className="text-gray-700">{word.meaning}</p>
      </div>

      {/* 例句 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 italic">{word.example}</p>
      </div>

      {/* 故事中的用法 */}
      {word.storyUsage && (
        <div className="mb-4">
          <span className="text-xs text-gray-400 uppercase tracking-wide">故事中的用法</span>
          <p className="text-sm text-gray-600 mt-1">{word.storyUsage}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleMasteredWord(word.text)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
            mastered
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Check className={`w-4 h-4 ${mastered ? 'text-green-600' : 'text-gray-400'}`} />
          {mastered ? '已掌握' : '标记掌握'}
        </button>
        <button
          onClick={() => toggleFavoriteWord(word.text)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
            favorite
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className={`w-4 h-4 ${favorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
          {favorite ? '已收藏' : '收藏'}
        </button>
      </div>
    </div>
  );
}
