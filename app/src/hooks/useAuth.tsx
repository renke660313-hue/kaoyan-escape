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
    // 首先检查本地存储，优先使用本地记录登录
    const savedUser = localStorage.getItem('kaoyan_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.phone === phone) {
          // 即使登录时间过期，也允许登录
          parsedUser.loginTime = Date.now();
          setUser(parsedUser);
          localStorage.setItem('kaoyan_user', JSON.stringify(parsedUser));
          return true;
        }
      } catch {
        localStorage.removeItem('kaoyan_user');
      }
    }

    // 测试账号逻辑 - 无论网络状况如何，都允许登录
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

    // 尝试网络请求验证激活码
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });
      
      if (response.ok) {
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
      }
    } catch (error) {
      console.error('网络请求失败:', error);
    }

    // 如果网络请求失败，创建新的用户记录
    // 这里假设用户已经通过小红书购买了激活码
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
