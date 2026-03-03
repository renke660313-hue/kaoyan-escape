import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, activationCode: string) => Promise<boolean>;
  logout: () => void;
  toggleMasteredWord: (word: string) => void;
  toggleFavoriteWord: (word: string) => void;
  isWordMastered: (word: string) => boolean;
  isWordFavorite: (word: string) => boolean;
  updateReadingProgress: (storyId: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 激活记录的本地存储 Key
const ACTIVATED_PHONES_KEY = 'kaoyan_activated_phones';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('kaoyan_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 登录有效期 30 天
        if (Date.now() - parsed.loginTime < 30 * 24 * 60 * 60 * 1000) {
          setUser(parsed);
        } else {
          localStorage.removeItem('kaoyan_user');
        }
      } catch (e) {
        localStorage.removeItem('kaoyan_user');
      }
    }
  }, []);

  const login = async (phone: string, code: string): Promise<boolean> => {
    // 模拟一个极短的网络延迟，增加真实感但不会报错
    await new Promise(resolve => setTimeout(resolve, 500));

    // 1. 获取已激活手机号列表
    const activatedPhones = JSON.parse(localStorage.getItem(ACTIVATED_PHONES_KEY) || '[]');
    const isAlreadyActivated = activatedPhones.includes(phone);

    // 2. 校验逻辑：已激活用户免码，新用户校验特定码 (KAOYAN2024)
    const isCodeValid = code.trim().toUpperCase() === 'KAOYAN2024';

    if (isAlreadyActivated || isCodeValid) {
      const newUser: User = {
        phone,
        isActivated: true,
        loginTime: Date.now(),
        masteredWords: [],
        favoriteWords: [],
        readingProgress: { storyId: 1, lastReadTime: Date.now() },
      };

      // 保存当前登录状态
      setUser(newUser);
      localStorage.setItem('kaoyan_user', JSON.stringify(newUser));

      // 如果是第一次激活，存入白名单
      if (!isAlreadyActivated) {
        activatedPhones.push(phone);
        localStorage.setItem(ACTIVATED_PHONES_KEY, JSON.stringify(activatedPhones));
      }

      return true;
    }

    // 如果校验不通过，直接抛出异常，让 UI 捕获并显示特定的错误
    throw new Error('INVALID_CODE');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaoyan_user'); // 仅退出登录，不清除激活白名单
  };

  // ... 单词管理相关代码保持不变 ...
  const toggleMasteredWord = (word: string) => {
    if (!user) return;
    const newWords = user.masteredWords.includes(word)
      ? user.masteredWords.filter(w => w !== word) : [...user.masteredWords, word];
    const updated = { ...user, masteredWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
  };

  const toggleFavoriteWord = (word: string) => {
    if (!user) return;
    const newWords = user.favoriteWords.includes(word)
      ? user.favoriteWords.filter(w => w !== word) : [...user.favoriteWords, word];
    const updated = { ...user, favoriteWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
  };

  const isWordMastered = (word: string) => user?.masteredWords.includes(word) ?? false;
  const isWordFavorite = (word: string) => user?.favoriteWords.includes(word) ?? false;

  const updateReadingProgress = (storyId: number) => {
    if (!user) return;
    const updated = { ...user, readingProgress: { storyId, lastReadTime: Date.now() } };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, login, logout,
      toggleMasteredWord, toggleFavoriteWord, isWordMastered, isWordFavorite, updateReadingProgress
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
