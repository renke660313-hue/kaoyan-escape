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

// 后端API地址
const API_BASE_URL = 'https://kaoyan-escape-production.up.railway.app/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('kaoyan_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.loginTime < 30 * 24 * 60 * 60 * 1000) {
          setUser(parsed);
        } else {
          localStorage.removeItem('kaoyan_user');
        }
      } catch {
        localStorage.removeItem('kaoyan_user');
      }
    }
  }, []);

  const login = async (phone: string, code: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        const newUser: User = {
          phone,
          isActivated: true,
          loginTime: Date.now(),
          masteredWords: [],
          favoriteWords: [],
          readingProgress: { storyId: 1, lastReadTime: Date.now() },
        };
        setUser(newUser);
        localStorage.setItem('kaoyan_user', JSON.stringify(newUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('登录失败:', error);
      // 开发环境下的测试账号
      if (phone === '13800138000' && code === 'KAOYAN2024') {
        const newUser: User = {
          phone,
          isActivated: true,
          loginTime: Date.now(),
          masteredWords: [],
          favoriteWords: [],
          readingProgress: { storyId: 1, lastReadTime: Date.now() },
        };
        setUser(newUser);
        localStorage.setItem('kaoyan_user', JSON.stringify(newUser));
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaoyan_user');
  };

  const toggleMasteredWord = (word: string) => {
    if (!user) return;
    const newWords = user.masteredWords.includes(word)
      ? user.masteredWords.filter(w => w !== word)
      : [...user.masteredWords, word];
    const updated = { ...user, masteredWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
  };

  const toggleFavoriteWord = (word: string) => {
    if (!user) return;
    const newWords = user.favoriteWords.includes(word)
      ? user.favoriteWords.filter(w => w !== word)
      : [...user.favoriteWords, word];
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
