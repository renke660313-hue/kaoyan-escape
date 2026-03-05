import { useState, useRef, useCallback } from 'react';
import { WordCard } from './WordCard';
import { useAuth } from '@/hooks/useAuth';
import type { Word } from '@/types';

interface StoryContentProps {
  content: string;
  words: Word[];
}

interface PopupState {
  word: Word | null;
  position: { x: number; y: number };
  visible: boolean;
}

export function StoryContent({ content, words }: StoryContentProps) {
  const { isWordMastered, isWordFavorite } = useAuth();
  const [popup, setPopup] = useState<PopupState>({
    word: null,
    position: { x: 0, y: 0 },
    visible: false,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // 创建单词映射，用于快速查找
  const wordMap = new Map(words.map(w => [w.text.toLowerCase(), w]));

  // 处理单词点击
  const handleWordClick = useCallback((e: React.MouseEvent, wordText: string) => {
    e.stopPropagation();
    
    const word = wordMap.get(wordText.toLowerCase());
    if (!word) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    setPopup({
      word,
      position: {
        x: rect.left + rect.width / 2 - 140,
        y: rect.top,
      },
      visible: true,
    });
  }, [wordMap]);

  // 关闭悬浮卡片
  const closePopup = useCallback(() => {
    setPopup(prev => ({ ...prev, visible: false }));
  }, []);

  // 处理点击外部关闭
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      closePopup();
    }
  }, [closePopup]);

  // 渲染带高亮单词的内容
  const renderContent = () => {
    // 将内容按单词分割，保留原文格式
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // 创建一个正则表达式来匹配所有单词
    const wordRegex = new RegExp(
      `\\b(${Array.from(wordMap.keys()).join('|')})\\b`,
      'gi'
    );
    
    let match;
    const contentStr = content;
    
    while ((match = wordRegex.exec(contentStr)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {contentStr.slice(lastIndex, match.index)}
          </span>
        );
      }
      
      const matchedWord = match[0];
      const lowerWord = matchedWord.toLowerCase();
      const isMastered = isWordMastered(matchedWord);
      const isFavorite = isWordFavorite(matchedWord);
      
      let className = 'word-highlight';
      if (isMastered) className += ' mastered';
      if (isFavorite) className += ' favorite';
      
      parts.push(
        <span
          key={`word-${match.index}`}
          className={className}
          onClick={(e) => handleWordClick(e, lowerWord)}
          title="点击查看详情"
        >
          {matchedWord}
        </span>
      );
      
      lastIndex = match.index + matchedWord.length;
    }
    
    // 添加剩余的文本
    if (lastIndex < contentStr.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {contentStr.slice(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div 
      className="relative"
      onClick={handleContentClick}
    >
      <div 
        ref={contentRef}
        className="story-content text-gray-700 leading-relaxed"
      >
        {renderContent()}
      </div>
      
      {/* 悬浮卡片 */}
      {popup.visible && popup.word && (
        <div ref={popupRef}>
          <WordCard
            word={popup.word}
            onClose={closePopup}
            position={popup.position}
          />
        </div>
      )}
    </div>
  );
}
