import fs from 'fs/promises';

async function cleanStoryContent() {
  try {
    const data = await fs.readFile('./stories.json', 'utf8');
    const storiesData = JSON.parse(data);
    
    const cleanedStories = storiesData.map((story, index) => {
      if (Array.isArray(story.content)) {
        const cleanedContent = story.content.map((paragraph, pIndex) => {
          // 移除段落开头的标题部分
          // 例如："午夜钟声这是一个悬疑故事。" -> "这是一个悬疑故事。"
          const titleWithoutChapter = story.title.replace(/^第\d+章：/, '');
          
          // 如果段落以标题开头，则移除标题
          if (paragraph.startsWith(titleWithoutChapter)) {
            return paragraph.substring(titleWithoutChapter.length);
          }
          
          return paragraph;
        });
        
        return {
          ...story,
          content: cleanedContent
        };
      }
      
      return story;
    });
    
    await fs.writeFile('./stories.json', JSON.stringify(cleanedStories, null, 2), 'utf8');
    
    console.log('清理完成！已处理', cleanedStories.length, '个故事');
  } catch (error) {
    console.error('处理过程中出错：', error);
  }
}

cleanStoryContent();
