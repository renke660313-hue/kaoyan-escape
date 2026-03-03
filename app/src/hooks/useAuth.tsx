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

// 后端 API 地址，确保末尾没有多余的斜杠
const API_BASE_URL = 'https://kaoyan-escape-production.up.railway.app/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 初始化：从本地存储读取当前登录状态
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
    try {
      // 1. 实现免激活码逻辑：检查该手机号是否曾在此设备成功激活过
      const isAlreadyActivated = localStorage.getItem(`activated_${phone}`) === 'true';

      // 2. 如果之前没激活过，则请求后端验证
      if (!isAlreadyActivated) {
        // 修正路径为 /verify-code，与 server.js 保持一致
        const response = await fetch(`${API_BASE_URL}/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code }),
        });

        const data = await response.json();

        // 如果后端返回验证失败，抛出错误进入 catch 块
        if (!response.ok || !data.valid) {
          console.error('验证失败:', data.message);
          return false;
        }

        // 验证成功，在本地永久记录该手机号已激活
        localStorage.setItem(`activated_${phone}`, 'true');
      }

      // 3. 创建并保存用户信息（已激活或免激活用户均可进入）
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
      // 捕获网络连接等异常，防止前端崩溃
      console.error('Login Error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // 退出仅清除当前登录态，不清除 activated_${phone} 记录，实现下次免激活
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
      user,
      isAuthenticated: !!user,
      login,
      logout,
      toggleMasteredWord,
      toggleFavoriteWord,
      isWordMastered,
      isWordFavorite,
      updateReadingProgress
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
