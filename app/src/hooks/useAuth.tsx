import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types';

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

// 后端 API 地址
const API_BASE_URL = 'https://kaoyan-escape-production.up.railway.app/api';

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
      } catch {
        localStorage.removeItem('kaoyan_user');
      }
    }
  }, []);

  const login = async (phone: string, code: string): Promise<boolean> => {
    // 【逻辑 1】万能码或本地已标记为“已激活”的绿色通道
    // 只要是万能码，或者该手机号在本地 localStorage 有激活标记
    const isLocallyActivated = localStorage.getItem('act_' + phone) === 'true';
    
    if (code === 'KAOYAN2024' || isLocallyActivated) {
      const newUser: User = {
        phone,
        isActivated: true,
        loginTime: Date.now(),
        masteredWords: user?.masteredWords || [],
        favoriteWords: user?.favoriteWords || [],
        readingProgress: user?.readingProgress || { storyId: 1, lastReadTime: Date.now() },
      };
      setUser(newUser);
      localStorage.setItem('kaoyan_user', JSON.stringify(newUser));
      localStorage.setItem('act_' + phone, 'true'); // 确保永久记住该手机号的激活状态
      return true;
    }

    // 【逻辑 2】首次使用随机激活码登录的正常验证流程
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (data.valid) { // 匹配后端 valid 字段
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
        // 【关键】登录成功后，立刻在本地永久记录该手机号已激活
        localStorage.setItem('act_' + phone, 'true'); 
        return true;
      }
      return false;
    } catch (error) {
      console.error('登录请求失败:', error);
      // 网络错误时，如果本地有激活标记，依然允许登录
      if (isLocallyActivated) return true;
      return false;
    }
  };

  const logout = () => {
    // 退出时，不清除 'act_' 开头的激活标记，只清除当前登录态
    setUser(null);
    localStorage.removeItem('kaoyan_user');
  };

  // ... 其余单词管理逻辑保持不变
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
