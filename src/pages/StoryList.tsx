import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, ChevronRight, Star, CheckCircle, Clock, TrendingUp, LogOut, User, Tag } from 'lucide-react';
import storiesData from '@/data/stories.json';

interface StoryListProps {
  onSelectStory: (storyId: number) => void;
}

export function StoryList({ onSelectStory }: StoryListProps) {
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // 计算学习进度
  const progress = useMemo(() => {
    const totalWords = 5500;
    const masteredCount = user?.masteredWords.length ?? 0;
    const favoriteCount = user?.favoriteWords.length ?? 0;
    const completedStories = Math.floor(masteredCount / 110);
    
    return {
      totalWords,
      masteredCount,
      favoriteCount,
      completedStories,
      progressPercent: Math.round((masteredCount / totalWords) * 100),
    };
  }, [user]);

  // 过滤故事
  const filteredStories = useMemo(() => {
    switch (filter) {
      case 'in-progress':
        return storiesData.filter(story => {
          const storyWords = story.words.map(w => w.text);
          const masteredCount = storyWords.filter(w => user?.masteredWords.includes(w)).length;
          return masteredCount > 0 && masteredCount < storyWords.length;
        });
      case 'completed':
        return storiesData.filter(story => {
          const storyWords = story.words.map(w => w.text);
          return storyWords.every(word => user?.masteredWords.includes(word));
        });
      default:
        return storiesData;
    }
  }, [filter, user]);

  // 获取故事的学习状态
  const getStoryStatus = (storyId: number) => {
    const story = storiesData.find(s => s.id === storyId);
    if (!story) return 'unread';
    
    const storyWords = story.words.map(w => w.text);
    const masteredCount = storyWords.filter(w => user?.masteredWords.includes(w)).length;
    
    if (masteredCount === 0) return 'unread';
    if (masteredCount === storyWords.length) return 'completed';
    return 'in-progress';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="navbar">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">考研单词故事</h1>
              <p className="text-xs text-gray-500">轻松掌握5500词</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.phone}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto p-6">
        {/* 学习进度概览 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">学习进度</h2>
            <span className="text-2xl font-bold">{progress.progressPercent}%</span>
          </div>
          
          <div className="progress-bar bg-white/20 mb-6">
            <div 
              className="progress-bar-fill bg-white"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm opacity-80">总单词</span>
              </div>
              <div className="text-2xl font-bold">{progress.totalWords}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm opacity-80">已掌握</span>
              </div>
              <div className="text-2xl font-bold">{progress.masteredCount}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4" />
                <span className="text-sm opacity-80">已收藏</span>
              </div>
              <div className="text-2xl font-bold">{progress.favoriteCount}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm opacity-80">完成故事</span>
              </div>
              <div className="text-2xl font-bold">{progress.completedStories}</div>
            </div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部故事
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'in-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            学习中
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            已完成
          </button>
        </div>

        {/* 故事列表 */}
        <div className="grid gap-4">
          {filteredStories.map((story) => {
            const status = getStoryStatus(story.id);
            const masteredCount = story.words.filter(w => 
              user?.masteredWords.includes(w.text)
            ).length;
            
            return (
              <div
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="story-card flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : status === 'in-progress'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {story.title}
                      </h3>
                      {(story as any).genre && (
                        <span className="tag bg-purple-100 text-purple-600 text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {(story as any).genre}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        110个单词
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {masteredCount}/110 已掌握
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {status === 'completed' && (
                    <span className="tag tag-mastered">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已完成
                    </span>
                  )}
                  {status === 'in-progress' && (
                    <span className="tag bg-blue-100 text-blue-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      学习中
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的故事</p>
          </div>
        )}
      </main>
    </div>
  );
}
