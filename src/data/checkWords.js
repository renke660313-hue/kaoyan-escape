import fs from 'fs/promises';

async function checkWords() {
  try {
    const data = await fs.readFile('./stories.json', 'utf8');
    const stories = JSON.parse(data);
    
    let totalWords = 0;
    const allWords = new Set();
    const duplicateWords = new Set();
    
    console.log('=== 故事单词检查 ===\n');
    
    // 遍历每个故事
    for (const story of stories) {
      if (story.words && Array.isArray(story.words)) {
        const wordCount = story.words.length;
        totalWords += wordCount;
        
        console.log(`故事 ${story.id}: ${story.title}`);
        console.log(`  单词数量: ${wordCount}`);
        
        // 检查是否有重复单词
        const storyWords = new Set();
        let hasDuplicates = false;
        
        for (const word of story.words) {
          if (storyWords.has(word.text)) {
            duplicateWords.add(word.text);
            hasDuplicates = true;
            console.log(`  重复单词: ${word.text}`);
          } else {
            storyWords.add(word.text);
          }
          
          if (allWords.has(word.text)) {
            duplicateWords.add(word.text);
          } else {
            allWords.add(word.text);
          }
        }
        
        if (!hasDuplicates) {
          console.log(`  无重复单词`);
        }
        
        console.log('');
      }
    }
    
    console.log('=== 汇总统计 ===');
    console.log(`总故事数: ${stories.length}`);
    console.log(`总单词数: ${totalWords}`);
    console.log(`去重后单词数: ${allWords.size}`);
    console.log(`重复单词数: ${duplicateWords.size}`);
    
    if (duplicateWords.size > 0) {
      console.log('\n重复的单词:');
      console.log([...duplicateWords].join(', '));
    }
    
  } catch (error) {
    console.error('处理过程中出现错误:', error);
  }
}

checkWords();