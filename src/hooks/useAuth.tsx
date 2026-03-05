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

// 后端API地址，从环境变量中读取，默认为本地开发地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 从后端获取用户数据
const fetchUserData = async (phone: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${phone}`);
    if (response.ok) {
      const data = await response.json();
      return {
        phone: data.phone,
        isActivated: true,
        loginTime: Date.now(),
        masteredWords: data.masteredWords || [],
        favoriteWords: data.favoriteWords || [],
        readingProgress: data.readingProgress || { storyId: 1, lastReadTime: Date.now() },
      };
    }
    return null;
  } catch (error) {
    console.error('获取用户数据失败:', error);
    return null;
  }
};

// 向后端同步用户数据
const syncUserData = async (user: User): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${user.phone}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        masteredWords: user.masteredWords,
        favoriteWords: user.favoriteWords,
        readingProgress: user.readingProgress,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('同步用户数据失败:', error);
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('kaoyan_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.loginTime < 30 * 24 * 60 * 60 * 1000) {
          // 从后端获取最新的用户数据
          fetchUserData(parsed.phone).then((userData) => {
            if (userData) {
              setUser(userData);
              localStorage.setItem('kaoyan_user', JSON.stringify(userData));
            } else {
              setUser(parsed);
            }
          });
        } else {
          localStorage.removeItem('kaoyan_user');
        }
      } catch {
        localStorage.removeItem('kaoyan_user');
      }
    }
  }, []);

  const login = async (phone: string, code: string): Promise<boolean> => {
    // 检查本地存储中是否已有该用户的记录
    const savedUser = localStorage.getItem('kaoyan_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.phone === phone) {
          // 如果是同一手机号，直接登录，不需要激活码
          // 从后端获取最新的用户数据
          const userData = await fetchUserData(phone);
          if (userData) {
            userData.loginTime = Date.now();
            setUser(userData);
            localStorage.setItem('kaoyan_user', JSON.stringify(userData));
          } else {
            parsedUser.loginTime = Date.now();
            setUser(parsedUser);
            localStorage.setItem('kaoyan_user', JSON.stringify(parsedUser));
          }
          return true;
        }
      } catch {
        localStorage.removeItem('kaoyan_user');
      }
    }

    // 首次登录，验证激活码
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });
      
      const data = await response.json();
      if (!data.valid) {
        console.error('激活码验证失败:', data.message);
        return false;
      }
    } catch (error) {
      console.error('验证激活码失败:', error);
      // 如果验证失败，仍然允许登录（开发环境）
    }

    // 从后端获取用户数据
    const userData = await fetchUserData(phone);
    if (userData) {
      userData.loginTime = Date.now();
      setUser(userData);
      localStorage.setItem('kaoyan_user', JSON.stringify(userData));
      return true;
    }

    // 如果后端获取失败，创建新的用户记录
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
    // 同步到后端
    syncUserData(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    // 不清除 localStorage 中的数据，以便用户再次登录时不需要激活码
  };

  const toggleMasteredWord = (word: string) => {
    if (!user) return;
    const newWords = user.masteredWords.includes(word)
      ? user.masteredWords.filter(w => w !== word)
      : [...user.masteredWords, word];
    const updated = { ...user, masteredWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
    // 同步到后端
    syncUserData(updated);
  };

  const toggleFavoriteWord = (word: string) => {
    if (!user) return;
    const newWords = user.favoriteWords.includes(word)
      ? user.favoriteWords.filter(w => w !== word)
      : [...user.favoriteWords, word];
    const updated = { ...user, favoriteWords: newWords };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
    // 同步到后端
    syncUserData(updated);
  };

  const isWordMastered = (word: string) => user?.masteredWords.includes(word) ?? false;
  const isWordFavorite = (word: string) => user?.favoriteWords.includes(word) ?? false;

  const updateReadingProgress = (storyId: number) => {
    if (!user) return;
    const updated = { ...user, readingProgress: { storyId, lastReadTime: Date.now() } };
    setUser(updated);
    localStorage.setItem('kaoyan_user', JSON.stringify(updated));
    // 同步到后端
    syncUserData(updated);
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
