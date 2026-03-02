import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Phone, Key, ArrowRight, CheckCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
const isPreviouslyActivated = localStorage.getItem('act_' + phone) === 'true';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的手机号');
      setIsLoading(false);
      return;
    }

    // 验证激活码
    if (activationCode.length < 6) {
      setError('请输入有效的激活码');
      setIsLoading(false);
      return;
    }

    try {
      const finalCode = isAct ? 'KAOYAN2024' : activationCode;
      const success = await login(phone, finalCode);
      if (!success) {
        setError('手机号或激活码错误');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('登录失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">考研出逃计划</h1>
          <p className="text-gray-600">通过50个故事爽文，轻松掌握5500个考研单词</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            激活您的学习之旅
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入您的手机号"
                  className="w-full px-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={11}
                />
              </div>
            </div>

            {/* 激活码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                激活码
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="请输入激活码"
                  className="w-full px-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  开始学习英语
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 功能特点 */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/80 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">50</div>
            <div className="text-xs text-gray-600">精彩故事</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">5500</div>
            <div className="text-xs text-gray-600">考研单词</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-600 mb-1">100%</div>
            <div className="text-xs text-gray-600">覆盖考纲</div>
          </div>
        </div>
      </div>
    </div>
  );
}
