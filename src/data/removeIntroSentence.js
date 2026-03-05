import fs from 'fs/promises';

async function removeIntroSentence() {
  try {
    const data = await fs.readFile('./stories.json', 'utf8');
    const stories = JSON.parse(data);
    
    // 遍历每个故事
    const updatedStories = stories.map(story => {
      // 检查故事是否有content属性且是数组
      if (story.content && Array.isArray(story.content) && story.content.length > 0) {
        // 处理第一个段落，移除开头的"这是一个xx故事"句子
        let firstParagraph = story.content[0];
        
        // 匹配开头的"这是一个xx故事"格式
        const introPattern = /^这是一个[\u4e00-\u9fa5]+故事。/;
        if (introPattern.test(firstParagraph)) {
          // 移除匹配的部分
          firstParagraph = firstParagraph.replace(introPattern, '');
          // 更新第一个段落
          story.content[0] = firstParagraph;
        }
      }
      return story;
    });
    
    // 写回文件
    await fs.writeFile('./stories.json', JSON.stringify(updatedStories, null, 2), 'utf8');
    console.log('成功移除所有故事开头的介绍句子');
  } catch (error) {
    console.error('处理过程中出现错误:', error);
  }
}

removeIntroSentence();