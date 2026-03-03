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

// 确保这里的 API 地址与你的 Railway 后端一致
const API_BASE_URL = 'https://kaoyan-escape-production.up.railway.app';

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
      } catch (e) {
        localStorage.removeItem('kaoyan_user');
      }
    }
  }, []);

  const login = async (phone: string, code: string): Promise<boolean> => {
    try {
      // 检查该手机号是否已在此设备激活过，实现第二次登录免激活码
      const isAlreadyActivated = localStorage.getItem(`activated_${phone}`) === 'true';

      if (!isAlreadyActivated) {
        // 请求后端验证激活码，路径必须是 /verify-code
        const response = await fetch(`${API_BASE_URL}/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code }),
        });

        const data = await response.json();
        if (!response.ok || !data.valid) return false;

        // 验证成功，永久记录激活状态
        localStorage.setItem(`activated_${phone}`, 'true');
      }

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
    } catch (error) {
      console.error('Login Error:', error);
      return false; // 捕获网络错误，防止 UI 弹出红色报错
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaoyan_user'); // 退出时不删除激活标记
  };

  const toggleMasteredWord = (word: string) => {
    if (!user) return;
    const newWords = user.masteredWords.includes(word) ? user.masteredWords.filter(w => w !== word) : [...user.masteredWords, word];
    const updated = { ...user, masteredWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
  };

  const toggleFavoriteWord = (word: string) => {
    if (!user) return;
    const newWords = user.favoriteWords.includes(word) ? user.favoriteWords.filter(w => w !== word) : [...user.favoriteWords, word];
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, toggleMasteredWord, toggleFavoriteWord, isWordMastered, isWordFavorite, updateReadingProgress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
