import fs from 'fs/promises';

async function processStories() {
  try {
    // 读取stories.json文件
    const data = await fs.readFile('./stories.json', 'utf8');
    const storiesData = JSON.parse(data);
    
    // 处理每个故事
    const processedStories = storiesData.map((story, index) => {
      // 移除title中的"第X章："前缀
      const newTitle = story.title.replace(/^第\d+章：/, '');
      
      // 移除content开头的"第X章："前缀
      let content = story.content.replace(/^第\d+章：/, '');
      
      // 移除多余的空格和换行
      content = content.trim();
      
      // 将内容分成5个段落
      // 策略：按句子分割，然后平均分配到5个段落
      const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
      const sentencesPerParagraph = Math.ceil(sentences.length / 5);
      
      const paragraphs = [];
      for (let i = 0; i < 5; i++) {
        const start = i * sentencesPerParagraph;
        const end = Math.min(start + sentencesPerParagraph, sentences.length);
        const paragraphSentences = sentences.slice(start, end);
        if (paragraphSentences.length > 0) {
          paragraphs.push(paragraphSentences.join('。') + '。');
        } else {
          // 如果内容不够，添加空段落
          paragraphs.push('');
        }
      }
      
      return {
        ...story,
        title: newTitle,
        content: paragraphs
      };
    });
    
    // 保存处理后的文件
    await fs.writeFile('./stories.json', JSON.stringify(processedStories, null, 2), 'utf8');
    
    console.log('处理完成！已处理', processedStories.length, '个故事');
  } catch (error) {
    console.error('处理过程中出错：', error);
  }
}

processStories();
