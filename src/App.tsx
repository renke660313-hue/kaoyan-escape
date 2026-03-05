import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Login } from '@/pages/Login';
import { StoryList } from '@/pages/StoryList';
import { StoryReader } from '@/pages/StoryReader';
import { Toaster } from '@/components/ui/sonner';

type Page = 'login' | 'storyList' | 'storyReader';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentStoryId, setCurrentStoryId] = useState<number>(1);

  // 根据认证状态自动切换页面
  if (isAuthenticated && currentPage === 'login') {
    setCurrentPage('storyList');
  }
  
  // 登出后自动切换到登录页面
  if (!isAuthenticated && currentPage !== 'login') {
    setCurrentPage('login');
  }

  const handleSelectStory = (storyId: number) => {
    setCurrentStoryId(storyId);
    setCurrentPage('storyReader');
  };

  const handleBackToList = () => {
    setCurrentPage('storyList');
  };

  const handleNextStory = () => {
    if (currentStoryId < 50) {
      setCurrentStoryId(prev => prev + 1);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryId > 1) {
      setCurrentStoryId(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen">
      {currentPage === 'login' && <Login />}
      
      {currentPage === 'storyList' && (
        <StoryList onSelectStory={handleSelectStory} />
      )}
      
      {currentPage === 'storyReader' && (
        <StoryReader
          storyId={currentStoryId}
          onBack={handleBackToList}
          onNextStory={handleNextStory}
          onPrevStory={handlePrevStory}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
