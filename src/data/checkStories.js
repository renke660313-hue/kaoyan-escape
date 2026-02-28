import fs from 'fs/promises';

async function checkStories() {
  const data = JSON.parse(await fs.readFile('./stories.json', 'utf8'));
  
  console.log('总故事数:', data.length);
  
  let allGood = true;
  data.forEach((story, index) => {
    if (!Array.isArray(story.content)) {
      console.log(`故事 ${story.id} (${story.title}): content 不是数组`);
      allGood = false;
    } else if (story.content.length !== 5) {
      console.log(`故事 ${story.id} (${story.title}): content 数组长度为 ${story.content.length}，应该是 5`);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log('✓ 所有故事都正确分成了5段');
  } else {
    console.log('✗ 部分故事有问题');
  }
}

checkStories();
