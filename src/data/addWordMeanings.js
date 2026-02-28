import fs from 'fs/promises';

// 单词的中文释义和例句
const wordDefinitions = {
  "steal": {
    meaning: "vt. 偷，窃取；vi. 偷东西；n. 偷窃，便宜货",
    example: "He was caught trying to steal a car. 他在偷汽车时被抓住了。"
  },
  "safe": {
    meaning: "adj. 安全的，平安的；n. 保险箱，保险柜",
    example: "The children are safe with their parents. 孩子们和父母在一起很安全。"
  },
  "colleague": {
    meaning: "n. 同事，同僚",
    example: "She works well with her colleagues. 她和同事们合作得很好。"
  },
  "lovely": {
    meaning: "adj. 可爱的，美丽的；令人愉快的",
    example: "What a lovely day it is! 多么美好的一天啊！"
  },
  "ox": {
    meaning: "n. 牛，公牛",
    example: "The ox pulled the heavy cart. 牛拉着沉重的车。"
  },
  "few": {
    meaning: "adj. 很少的，几乎没有的；pron. 很少，少数",
    example: "Few people can speak Chinese fluently. 很少有人能流利地说中文。"
  },
  "debut": {
    meaning: "n. 首次亮相，初次登台；vi. 首次登台",
    example: "The young singer made her debut last night. 这位年轻歌手昨晚首次登台。"
  },
  "beneficial": {
    meaning: "adj. 有益的，有利的",
    example: "Regular exercise is beneficial to health. 定期锻炼对健康有益。"
  },
  "rash": {
    meaning: "adj. 轻率的，鲁莽的；n. 皮疹，疹子",
    example: "It was rash of him to make such a decision. 他做出这样的决定太轻率了。"
  },
  "bury": {
    meaning: "vt. 埋葬，掩埋；隐藏，埋藏",
    example: "They buried the dead dog in the garden. 他们把死狗埋在花园里。"
  },
  "tear": {
    meaning: "n. 眼泪，泪水；v. 撕，扯",
    example: "Tears rolled down her cheeks. 泪水从她的脸颊上滚落下来。"
  },
  "practical": {
    meaning: "adj. 实际的，实用的；注重实际的",
    example: "This is a practical solution to the problem. 这是解决问题的实际方法。"
  },
  "leak": {
    meaning: "v. 漏，泄漏；n. 漏洞，泄漏",
    example: "The pipe is leaking water. 管道在漏水。"
  },
  "card": {
    meaning: "n. 卡片，纸牌；名片",
    example: "He gave me his business card. 他给了我他的名片。"
  },
  "negro": {
    meaning: "n. 黑人（过时用法，现在通常使用 African American）",
    example: "The term 'negro' is now considered outdated. 'negro'一词现在被认为是过时的。"
  },
  "ego": {
    meaning: "n. 自我，自尊心",
    example: "He has a big ego. 他自尊心很强。"
  },
  "resign": {
    meaning: "v. 辞职，放弃；使听从，使顺从",
    example: "She resigned from her job last week. 她上周辞职了。"
  },
  "feedback": {
    meaning: "n. 反馈，回应",
    example: "We need your feedback on the new product. 我们需要你对新产品的反馈。"
  },
  "clone": {
    meaning: "n. 克隆，复制品；v. 克隆，复制",
    example: "Scientists cloned a sheep named Dolly. 科学家克隆了一只名叫多莉的羊。"
  },
  "eternal": {
    meaning: "adj. 永恒的，不朽的",
    example: "Love is eternal. 爱是永恒的。"
  },
  "fear": {
    meaning: "n. 害怕，恐惧；v. 害怕，恐惧",
    example: "She has a fear of heights. 她恐高。"
  },
  "devil": {
    meaning: "n. 魔鬼，恶魔",
    example: "The devil is often depicted as a horned creature. 魔鬼通常被描绘成有角的生物。"
  },
  "curtain": {
    meaning: "n. 窗帘，幕布",
    example: "She drew the curtains to block out the sun. 她拉上窗帘遮挡阳光。"
  },
  "mistress": {
    meaning: "n. 情妇；女主人",
    example: "The mistress of the house welcomed us. 房子的女主人欢迎了我们。"
  },
  "rib": {
    meaning: "n. 肋骨；排骨",
    example: "He broke a rib in the accident. 他在事故中折断了一根肋骨。"
  },
  "discourage": {
    meaning: "v. 使气馁，使沮丧；劝阻",
    example: "Don't let failure discourage you. 不要让失败使你气馁。"
  },
  "worth": {
    meaning: "adj. 值得的，有价值的；n. 价值，财产",
    example: "The book is worth reading. 这本书值得一读。"
  },
  "react": {
    meaning: "v. 反应，回应；起反应",
    example: "How did she react to the news? 她对这个消息有什么反应？"
  },
  "monument": {
    meaning: "n. 纪念碑，纪念物",
    example: "The monument was built to honor the soldiers. 这座纪念碑是为了纪念士兵们而建造的。"
  },
  "embody": {
    meaning: "v. 体现，包含；使具体化",
    example: "The statue embodies the spirit of freedom. 这座雕像体现了自由精神。"
  },
  "congratulate": {
    meaning: "v. 祝贺，恭喜",
    example: "I congratulate you on your success. 我祝贺你取得成功。"
  },
  "recommend": {
    meaning: "v. 推荐，建议",
    example: "I recommend this book to you. 我向你推荐这本书。"
  },
  "infant": {
    meaning: "n. 婴儿，幼儿",
    example: "The infant was sleeping peacefully. 婴儿在安静地睡觉。"
  },
  "jazz": {
    meaning: "n. 爵士乐",
    example: "He loves listening to jazz. 他喜欢听爵士乐。"
  },
  "ghost": {
    meaning: "n. 鬼，幽灵",
    example: "The old house is said to be haunted by a ghost. 据说那座老房子闹鬼。"
  },
  "comb": {
    meaning: "n. 梳子；v. 梳理",
    example: "She combed her hair before going out. 她出门前梳了头发。"
  },
  "industrialize": {
    meaning: "v. 使工业化",
    example: "The country is trying to industrialize. 这个国家正在努力实现工业化。"
  },
  "continue": {
    meaning: "v. 继续，持续",
    example: "Let's continue our discussion tomorrow. 让我们明天继续讨论。"
  },
  "standpoint": {
    meaning: "n. 立场，观点",
    example: "From my standpoint, this is a good idea. 从我的观点来看，这是个好主意。"
  },
  "wage": {
    meaning: "n. 工资，报酬；v. 进行，发动",
    example: "He earns a good wage. 他挣得一份不错的工资。"
  },
  "drip": {
    meaning: "v. 滴，滴落；n. 水滴，滴水声",
    example: "The faucet is dripping. 水龙头在滴水。"
  },
  "permeate": {
    meaning: "v. 渗透，弥漫",
    example: "The smell of coffee permeated the room. 咖啡的香味弥漫了整个房间。"
  },
  "shed": {
    meaning: "n. 棚屋，小屋；v. 脱落，流出",
    example: "The snake shed its skin. 蛇蜕皮了。"
  },
  "wing": {
    meaning: "n. 翅膀，翼；v. 飞行，飞过",
    example: "The bird spread its wings and flew away. 鸟展开翅膀飞走了。"
  },
  "elsewhere": {
    meaning: "adv. 在别处，到别处",
    example: "If you can't find it here, look elsewhere. 如果你在这里找不到，就到别处看看。"
  },
  "fog": {
    meaning: "n. 雾；v. 使模糊，使困惑",
    example: "The fog made it difficult to see. 雾使视线变得模糊。"
  },
  "meat": {
    meaning: "n. 肉，肉类",
    example: "We had meat for dinner. 我们晚餐吃了肉。"
  },
  "famous": {
    meaning: "adj. 著名的，出名的",
    example: "He is a famous actor. 他是一位著名的演员。"
  },
  "selfish": {
    meaning: "adj. 自私的，利己的",
    example: "It's selfish of you to take all the cake. 你把所有的蛋糕都拿走，真是自私。"
  },
  "dismay": {
    meaning: "n. 沮丧，失望；v. 使沮丧，使失望",
    example: "To our dismay, the project failed. 令我们失望的是，项目失败了。"
  },
  "millionaire": {
    meaning: "n. 百万富翁",
    example: "He became a millionaire at a young age. 他在年轻时就成了百万富翁。"
  },
  "bathroom": {
    meaning: "n. 浴室，卫生间",
    example: "The bathroom is on the second floor. 浴室在二楼。"
  },
  "ready": {
    meaning: "adj. 准备好的，现成的；愿意的",
    example: "Are you ready for the exam? 你准备好考试了吗？"
  },
  "strong": {
    meaning: "adj. 强壮的，强大的；强烈的",
    example: "He is a strong man. 他是一个强壮的人。"
  },
  "amiable": {
    meaning: "adj. 和蔼可亲的，友好的",
    example: "She has an amiable personality. 她性格和蔼可亲。"
  },
  "search": {
    meaning: "v. 搜索，寻找；n. 搜索，寻找",
    example: "I'm searching for my keys. 我在找我的钥匙。"
  },
  "abolish": {
    meaning: "v. 废除，取消",
    example: "Slavery was abolished in the 19th century. 奴隶制在19世纪被废除。"
  },
  "ally": {
    meaning: "n. 盟友，同盟者；v. 与...结盟",
    example: "The two countries are allies. 这两个国家是盟友。"
  },
  "meditate": {
    meaning: "v. 冥想，沉思",
    example: "She meditates every morning. 她每天早上冥想。"
  },
  "humble": {
    meaning: "adj. 谦逊的，谦虚的；卑微的",
    example: "He is a humble man. 他是一个谦逊的人。"
  },
  "episode": {
    meaning: "n. 插曲，片段；一集",
    example: "The next episode of the series will air tomorrow. 该系列的下一集将于明天播出。"
  },
  "occur": {
    meaning: "v. 发生，出现；存在",
    example: "The accident occurred at midnight. 事故发生在午夜。"
  },
  "tunnel": {
    meaning: "n. 隧道，地道；v. 挖隧道",
    example: "The train went through a tunnel. 火车穿过了隧道。"
  },
  "analogy": {
    meaning: "n. 类比，比喻",
    example: "He explained the concept using an analogy. 他用类比解释了这个概念。"
  },
  "adult": {
    meaning: "adj. 成年的，成熟的；n. 成年人",
    example: "He is now an adult. 他现在是成年人了。"
  },
  "vegetation": {
    meaning: "n. 植被，植物",
    example: "The area is covered with dense vegetation. 这个地区覆盖着茂密的植被。"
  },
  "luxury": {
    meaning: "n. 奢侈，豪华；奢侈品",
    example: "Living in a big house is a luxury. 住在大房子里是一种奢侈。"
  },
  "cell": {
    meaning: "n. 细胞；牢房，小房间",
    example: "The human body is made up of cells. 人体由细胞组成。"
  },
  "outfit": {
    meaning: "n. 装备，全套服装；v. 配备，装备",
    example: "She wore a new outfit to the party. 她穿了一套新衣服去参加聚会。"
  },
  "population": {
    meaning: "n. 人口，人口数量",
    example: "The population of the city is growing. 这个城市的人口在增长。"
  },
  "fling": {
    meaning: "v. 猛扔，抛；n. 短暂的恋情",
    example: "He flung the ball across the field. 他把球扔过了球场。"
  },
  "sideways": {
    meaning: "adv. 向侧面，斜着；adj. 向侧面的，斜的",
    example: "He looked sideways at her. 他斜眼看着她。"
  },
  "employee": {
    meaning: "n. 雇员，员工",
    example: "The company has 100 employees. 这家公司有100名员工。"
  },
  "over": {
    meaning: "prep. 在...上方，越过；adv. 结束，完成",
    example: "The plane flew over the city. 飞机飞过城市。"
  },
  "base": {
    meaning: "n. 基础，底座；基地；v. 以...为基础",
    example: "The base of the building is very strong. 建筑物的基础非常坚固。"
  },
  "amount": {
    meaning: "n. 数量，总额；v. 总计，等于",
    example: "The amount of money is too small. 钱的数量太少了。"
  },
  "spontaneous": {
    meaning: "adj. 自发的，自然的",
    example: "The applause was spontaneous. 掌声是自发的。"
  },
  "sorrow": {
    meaning: "n. 悲伤，悲痛",
    example: "She felt deep sorrow at her father's death. 她对父亲的去世感到深深的悲痛。"
  },
  "lean": {
    meaning: "v. 倾斜，倚靠；adj. 瘦的，苗条的",
    example: "He leaned against the wall. 他靠在墙上。"
  },
  "weekday": {
    meaning: "n. 工作日",
    example: "I work on weekdays. 我在工作日工作。"
  },
  "guarantee": {
    meaning: "n. 保证，担保；v. 保证，担保",
    example: "The product comes with a one-year guarantee. 该产品有一年的保修期。"
  },
  "handle": {
    meaning: "n. 把手，柄；v. 处理，应付",
    example: "He couldn't handle the pressure. 他无法承受压力。"
  },
  "offspring": {
    meaning: "n. 子女，后代",
    example: "The cat has several offspring. 这只猫有几个后代。"
  },
  "june": {
    meaning: "n. 六月",
    example: "My birthday is in June. 我的生日在六月。"
  },
  "span": {
    meaning: "n. 跨度，范围；v. 横跨，跨越",
    example: "The bridge has a span of 100 meters. 这座桥的跨度为100米。"
  },
  "excess": {
    meaning: "n. 过量，过剩；adj. 过量的，额外的",
    example: "Eating in excess can lead to health problems. 过量饮食会导致健康问题。"
  },
  "strife": {
    meaning: "n. 冲突，争斗",
    example: "The country was torn by civil strife. 这个国家因内战而四分五裂。"
  },
  "stool": {
    meaning: "n. 凳子， stool",
    example: "He sat on a stool. 他坐在凳子上。"
  },
  "narrative": {
    meaning: "n. 叙述，故事；adj. 叙述的",
    example: "The novel has a compelling narrative. 这部小说有引人入胜的叙述。"
  },
  "litter": {
    meaning: "n. 垃圾，废弃物；v. 乱扔，使杂乱",
    example: "Please don't litter. 请不要乱扔垃圾。"
  },
  "complex": {
    meaning: "adj. 复杂的，复合的；n. 综合体，情结",
    example: "The problem is very complex. 这个问题非常复杂。"
  },
  "handicap": {
    meaning: "n. 障碍，缺陷；v. 妨碍，使不利",
    example: "His lack of education is a handicap. 他缺乏教育是一个障碍。"
  },
  "recruit": {
    meaning: "v. 招募，吸收；n. 新兵，新成员",
    example: "The company is recruiting new employees. 公司正在招募新员工。"
  },
  "cheque": {
    meaning: "n. 支票（英国英语，美国英语为 check）",
    example: "He wrote a cheque for $100. 他开了一张100美元的支票。"
  },
  "truth": {
    meaning: "n. 真相，事实；真理",
    example: "Tell me the truth. 告诉我真相。"
  },
  "little": {
    meaning: "adj. 小的，少的；adv. 少，一点",
    example: "She has a little dog. 她有一只小狗。"
  },
  "horror": {
    meaning: "n. 恐怖，恐惧；恐怖电影",
    example: "I don't like horror movies. 我不喜欢恐怖电影。"
  },
  "portfolio": {
    meaning: "n. 公文包，文件夹；投资组合",
    example: "He carried his portfolio to the meeting. 他带着公文包去开会。"
  },
  "compose": {
    meaning: "v. 组成，构成；创作，作曲",
    example: "Water is composed of hydrogen and oxygen. 水由氢和氧组成。"
  },
  "diary": {
    meaning: "n. 日记，日记本",
    example: "She writes in her diary every day. 她每天写日记。"
  },
  "zone": {
    meaning: "n. 区域，地带；v. 划分区域",
    example: "This is a no parking zone. 这是禁止停车区。"
  },
  "inspect": {
    meaning: "v. 检查，视察",
    example: "The teacher inspected the students' homework. 老师检查了学生的作业。"
  },
  "graph": {
    meaning: "n. 图表，曲线图；v. 用图表表示",
    example: "The graph shows the temperature change. 图表显示了温度变化。"
  },
  "decide": {
    meaning: "v. 决定，决心",
    example: "I've decided to study abroad. 我决定出国留学。"
  },
  "implement": {
    meaning: "v. 实施，执行；n. 工具，器具",
    example: "The company will implement the new policy. 公司将实施新政策。"
  },
  "suburb": {
    meaning: "n. 郊区，城郊",
    example: "He lives in the suburbs. 他住在郊区。"
  },
  "shame": {
    meaning: "n. 羞耻，羞愧；v. 使羞耻，使蒙羞",
    example: "He felt shame for his actions. 他为自己的行为感到羞愧。"
  },
  "correct": {
    meaning: "adj. 正确的，对的；v. 纠正，改正",
    example: "Your answer is correct. 你的答案是正确的。"
  },
  "sneak": {
    meaning: "v. 偷偷地走，溜；n. 鬼鬼祟祟的人",
    example: "He sneaked out of the house. 他偷偷溜出了房子。"
  },
  "catholic": {
    meaning: "adj. 广泛的，普遍的；天主教的；n. 天主教徒",
    example: "The museum has a catholic collection of art. 博物馆有广泛的艺术收藏。"
  }
};

async function addWordMeanings() {
  try {
    const data = await fs.readFile('./stories.json', 'utf8');
    const stories = JSON.parse(data);
    
    // 遍历每个故事
    const updatedStories = stories.map(story => {
      // 检查故事是否有words属性且是数组
      if (story.words && Array.isArray(story.words)) {
        // 遍历每个单词
        story.words = story.words.map(word => {
          // 检查是否有该单词的定义
          if (wordDefinitions[word.text]) {
            // 更新中文释义和例句
            word.meaning = wordDefinitions[word.text].meaning;
            word.example = wordDefinitions[word.text].example;
          }
          return word;
        });
      }
      return story;
    });
    
    // 写回文件
    await fs.writeFile('./stories.json', JSON.stringify(updatedStories, null, 2), 'utf8');
    console.log('成功为单词添加中文释义和例句');
  } catch (error) {
    console.error('处理过程中出现错误:', error);
  }
}

addWordMeanings();