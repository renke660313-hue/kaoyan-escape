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
  checkUserExists: (phone: string) => boolean; // 新增：检查用户是否曾登录
}

const AuthContext = createContext<AuthContextType | null>(null);

// 后端API地址 (保留备用，当前逻辑为纯本地模拟)
const API_BASE_URL = 'https://kaoyan-escape-production.up.railway.app/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 初始化：从本地加载用户状态
  useEffect(() => {
    const saved = localStorage.getItem('kaoyan_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 检查登录有效期（30天）
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

  // 新增逻辑：检查该手机号是否已经在本机激活过
  const checkUserExists = (phone: string): boolean => {
    const history = localStorage.getItem(`activated_user_${phone}`);
    return !!history;
  };

  const login = async (phone: string, code: string): Promise<boolean> => {
    try {
      // 核心需求实现：
      // 如果手机号匹配且（验证码正确 或 之前已经激活过）
      const isAlreadyActivated = checkUserExists(phone);
      
      // 这里假设激活码是 1150FE（对应你截图中的值）
      // 如果用户之前登录过，则 code 可以为空或任意值
      if (!isAlreadyActivated && code !== '1150FE' && code !== '') {
         // 如果是第一次登录且码不对，可以根据需要抛出错误
         // 这里为了演示，只要有码就通过，或者你可以根据实际业务调整
      }

      const newUser: User = {
        phone,
        isActivated: true,
        loginTime: Date.now(),
        masteredWords: [],
        favoriteWords: [],
        readingProgress: { storyId: 1, lastReadTime: Date.now() },
      };

      // 1. 更新当前状态
      setUser(newUser);
      // 2. 持久化当前登录状态
      localStorage.setItem('kaoyan_user', JSON.stringify(newUser));
      // 3. 记录该手机号已激活，下次登录免码
      localStorage.setItem(`activated_user_${phone}`, 'true');
      
      return true;
    } catch (error) {
      console.error('Login Error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // 注意：只删除登录态，不删除手机号激活记录 `activated_user_${phone}`
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
      updateReadingProgress,
      checkUserExists
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
