import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StoryContent } from '@/components/StoryContent';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  X
} from 'lucide-react';
import storiesData from '@/data/stories.json';
import type { Story } from '@/types';

interface StoryReaderProps {
  storyId: number;
  onBack: () => void;
  onNextStory: () => void;
  onPrevStory: () => void;
}

export function StoryReader({ storyId, onBack, onNextStory, onPrevStory }: StoryReaderProps) {
  const { toggleMasteredWord, toggleFavoriteWord, isWordMastered, isWordFavorite, updateReadingProgress } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [showWordList, setShowWordList] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mastered' | 'favorite'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  // 动态计算总页数
  const totalPages = useMemo(() => {
    if (!story) return 1;
    if (Array.isArray(story.content)) {
      return story.content.length;
    }
    return 1;
  }, [story]);

  useEffect(() => {
    const foundStory = storiesData.find(s => s.id === storyId);
    if (foundStory) {
      setStory(foundStory as Story);
      updateReadingProgress(storyId);
      setCurrentPage(0); // 切换故事时重置页码
      console.log('故事加载完成', {
        storyId,
        title: foundStory.title,
        contentType: typeof foundStory.content,
        isArray: Array.isArray(foundStory.content),
        contentLength: Array.isArray(foundStory.content) ? foundStory.content.length : 'not array'
      });
    }
  }, [storyId]);

  // 处理翻页
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading text-gray-400">加载中...</div>
      </div>
    );
  }

  // 统计单词状态
  const wordStats = {
    total: story.words.length,
    mastered: story.words.filter(w => isWordMastered(w.text)).length,
    favorite: story.words.filter(w => isWordFavorite(w.text)).length,
  };

  // 过滤单词列表
  const filteredWords = story.words.filter(word => {
    if (activeTab === 'mastered') return isWordMastered(word.text);
    if (activeTab === 'favorite') return isWordFavorite(word.text);
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="navbar sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">{story.title}</h1>
              <p className="text-xs text-gray-500">第 {story.id}/50 章</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 单词统计 */}
            <button
              onClick={() => setShowWordList(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {wordStats.mastered}/{wordStats.total}
              </span>
            </button>

            {/* 故事切换 */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPrevStory}
                disabled={storyId === 1}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onNextStory}
                disabled={storyId === 50}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto p-6">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>学习进度</span>
            <span>{Math.round((wordStats.mastered / wordStats.total) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${(wordStats.mastered / wordStats.total) * 100}%` }}
            />
          </div>
        </div>

        {/* 故事内容卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">

          
          <StoryContent 
            content={Array.isArray(story.content) ? story.content[currentPage] : story.content} 
            words={story.words} 
          />
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowWordList(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span>查看单词列表</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            <span className="text-sm text-gray-600">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* 单词列表面板 */}
      {showWordList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* 面板头部 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">单词列表</h2>
              <button
                onClick={() => setShowWordList(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 统计标签 */}
            <div className="flex items-center gap-2 p-4 border-b">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部 ({wordStats.total})
              </button>
              <button
                onClick={() => setActiveTab('mastered')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'mastered'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                已掌握 ({wordStats.mastered})
              </button>
              <button
                onClick={() => setActiveTab('favorite')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'favorite'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star className="w-4 h-4" />
                已收藏 ({wordStats.favorite})
              </button>
            </div>

            {/* 单词列表 */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid gap-2">
                {filteredWords.map((word) => (
                  <div
                    key={word.text}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{word.text}</span>
                        <span className="text-sm text-gray-500 font-mono">{word.phonetic}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{word.meaning}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMasteredWord(word.text)}
                        className={`p-2 rounded-lg transition-colors ${
                          isWordMastered(word.text)
                            ? 'bg-green-100 text-green-600'
                            : 'bg-white text-gray-400 hover:text-green-600'
                        }`}
                        title={isWordMastered(word.text) ? '取消掌握' : '标记掌握'}
                      >
                        <CheckCircle className={`w-5 h-5 ${isWordMastered(word.text) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => toggleFavoriteWord(word.text)}
                        className={`p-2 rounded-lg transition-colors ${
                          isWordFavorite(word.text)
                            ? 'bg-amber-100 text-amber-500'
                            : 'bg-white text-gray-400 hover:text-amber-500'
                        }`}
                        title={isWordFavorite(word.text) ? '取消收藏' : '收藏单词'}
                      >
                        <Star className={`w-5 h-5 ${isWordFavorite(word.text) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredWords.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无符合条件的单词</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
