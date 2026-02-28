// 用户类型
export interface User {
  phone: string;
  isActivated: boolean;
  loginTime: number;
  masteredWords: string[];
  favoriteWords: string[];
  readingProgress: {
    storyId: number;
    lastReadTime: number;
  };
}

// 单词类型
export interface Word {
  text: string;
  phonetic: string;
  meaning: string;
  example: string;
  storyUsage: string;
}

// 故事类型
export interface Story {
  id: number;
  title: string;
  genre: string;
  content: string;
  words: Word[];
  wordPositions?: WordPosition[];
}

// 单词在故事中的位置
export interface WordPosition {
  word: string;
  startIndex: number;
  endIndex: number;
}

// 学习进度
export interface LearningProgress {
  totalWords: number;
  masteredCount: number;
  favoriteCount: number;
  completedStories: number[];
}
