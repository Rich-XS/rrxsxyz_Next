// 自媒体百问数据
export const questionData = {
  purpose: {
    title: "定位 (Purpose)",
    description: "你为何存在？你是谁，你带来什么独特价值？",
    questions: [
      {
        id: 1,
        text: "除了赚钱，驱动你品牌的唯一使命是什么？",
        type: "text",
        placeholder: "例如：帮助职场妈妈实现工作与生活的平衡"
      },
      {
        id: 2,
        text: "用一句话描述你的核心价值主张，让一个10岁的孩子也能听懂。",
        type: "text",
        placeholder: "例如：我教人们用手机拍出好看的照片"
      },
      {
        id: 3,
        text: "如果你的品牌是一个人，你会如何描述他/她的性格、价值观和声音？",
        type: "text",
        placeholder: "例如：专业但亲和，严谨但不失幽默"
      },
      {
        id: 4,
        text: "未来三年，你希望在你的领域内达到什么样的地位或影响力？",
        type: "text",
        placeholder: "例如：成为小红书美妆领域TOP10博主"
      },
      {
        id: 5,
        text: "你的'不公平优势'是什么，是他人无法轻易复制的？",
        type: "text",
        placeholder: "例如：10年化妆师经验+明星客户资源"
      },
      {
        id: 6,
        text: "你最不能容忍的行业乱象是什么？你的品牌如何成为一股清流？",
        type: "text",
        placeholder: "例如：反对虚假宣传，只推荐真正用过的产品"
      },
      {
        id: 7,
        text: "你决心不服务于哪类人群？为什么？",
        type: "text",
        placeholder: "例如：不服务预算低于1000元的客户"
      },
      {
        id: 8,
        text: "你的内容创作遵循哪三个核心原则？",
        type: "text",
        placeholder: "例如：真实、实用、有趣"
      },
      {
        id: 9,
        text: "在你的专业领域，你最想颠覆或挑战的一个固有观念是什么？",
        type: "text",
        placeholder: "例如：护肤不一定要用昂贵的产品"
      },
      {
        id: 10,
        text: "你的品牌名称、Logo和Slogan是否一致地传达了你的核心定位？",
        type: "radio",
        options: [
          { value: 1, label: "完全不一致" },
          { value: 2, label: "基本不一致" },
          { value: 3, label: "一般" },
          { value: 4, label: "比较一致" },
          { value: 5, label: "完全一致" }
        ]
      },
      {
        id: 11,
        text: "描述一下你理想中的工作状态和商业模式。",
        type: "text",
        placeholder: "例如：在家工作，通过在线课程获得被动收入"
      },
      {
        id: 12,
        text: "你的个人故事或经历如何与你的品牌定位相结合？",
        type: "text",
        placeholder: "例如：从胖子到健身教练的逆袭故事"
      },
      {
        id: 13,
        text: "你如何定义你所在赛道的边界？你是在一个现有市场竞争，还是在开创一个新品类？",
        type: "radio",
        options: [
          { value: 1, label: "完全在红海竞争" },
          { value: 2, label: "主要在红海，有少量创新" },
          { value: 3, label: "红海蓝海各一半" },
          { value: 4, label: "主要在蓝海，有少量竞争" },
          { value: 5, label: "完全开创新品类" }
        ]
      },
      {
        id: 14,
        text: "你的知识体系中，哪一部分最具商业价值？",
        type: "text",
        placeholder: "例如：快速减脂的饮食搭配方法"
      },
      {
        id: 15,
        text: "如果所有竞争对手都消失了，你的业务会有什么不同？",
        type: "text",
        placeholder: "例如：会更专注于产品研发而非营销"
      },
      {
        id: 16,
        text: "你希望用户在提到你的名字时，联想到的第一个关键词是什么？",
        type: "text",
        placeholder: "例如：专业、可信、实用"
      },
      {
        id: 17,
        text: "你愿意为你的品牌声誉付出什么代价？",
        type: "text",
        placeholder: "例如：宁可少赚钱也不做虚假宣传"
      },
      {
        id: 18,
        text: "你的商业模式中，哪一部分最让你感到兴奋和自豪？",
        type: "text",
        placeholder: "例如：帮助学员实现真正的改变"
      },
      {
        id: 19,
        text: "你如何平衡短期盈利和长期品牌建设？",
        type: "radio",
        options: [
          { value: 1, label: "完全专注短期盈利" },
          { value: 2, label: "主要关注短期，兼顾长期" },
          { value: 3, label: "短期长期并重" },
          { value: 4, label: "主要关注长期，兼顾短期" },
          { value: 5, label: "完全专注长期品牌" }
        ]
      },
      {
        id: 20,
        text: "最终，你希望你的事业为世界留下什么？",
        type: "text",
        placeholder: "例如：让更多人拥有健康的生活方式"
      }
    ]
  },
  people: {
    title: "用户 (People)",
    description: "你为谁服务？深度理解你的目标受众。",
    questions: [
      {
        id: 21,
        text: "你的'陪睡熊猫眼宝妈'是谁？请极其具体地描述你的超细分核心用户。",
        type: "text",
        placeholder: "例如：25-35岁，一线城市，有1-2个孩子的职场妈妈"
      },
      {
        id: 22,
        text: "你的理想客户在遇到问题时，会去哪个平台搜索什么关键词？",
        type: "text",
        placeholder: "例如：在小红书搜索'产后减肥方法'"
      },
      {
        id: 23,
        text: "描绘一个典型用户的24小时，标记出他们可能与你的内容或产品互动的场景。",
        type: "text",
        placeholder: "例如：早上7点通勤路上刷抖音，晚上10点躺床上看小红书"
      },
      {
        id: 24,
        text: "你的用户在购买决策前，最大的顾虑和障碍是什么？",
        type: "text",
        placeholder: "例如：担心没时间学习，怕买了用不上"
      },
      {
        id: 25,
        text: "描述一个高风险、高意图的情境，在此情境下他们愿意为解决方案支付高价。",
        type: "text",
        placeholder: "例如：孩子即将上学，急需快速恢复身材"
      },
      {
        id: 26,
        text: "你的用户已经尝试过哪些失败的解决方案？他们为什么会失败？",
        type: "text",
        placeholder: "例如：试过节食减肥，但因为太饿坚持不下去"
      },
      {
        id: 27,
        text: "除了功能需求，你的用户在情感和精神层面最渴望得到什么？",
        type: "text",
        placeholder: "例如：重新找回自信，获得家人认可"
      },
      {
        id: 28,
        text: "你的用户最常使用的社交媒体和内容消费平台是哪些？",
        type: "text",
        placeholder: "例如：小红书、抖音、微信朋友圈"
      },
      {
        id: 29,
        text: "描绘出你的核心用户和次要用户的画像差异。",
        type: "text",
        placeholder: "例如：核心用户是宝妈，次要用户是单身白领女性"
      },
      {
        id: 30,
        text: "你的用户在做出购买决策时，最信任谁的推荐？",
        type: "radio",
        options: [
          { value: 1, label: "陌生人评价" },
          { value: 2, label: "网红KOL" },
          { value: 3, label: "朋友推荐" },
          { value: 4, label: "专家意见" },
          { value: 5, label: "亲身体验" }
        ]
      },
      {
        id: 31,
        text: "你的用户在消费你的内容后，最希望获得的'一句话收获'是什么？",
        type: "text",
        placeholder: "例如：原来减肥可以这么简单"
      },
      {
        id: 32,
        text: "你的用户群体内部是否存在不同的细分，他们各自的需求有何不同？",
        type: "text",
        placeholder: "例如：新手妈妈需要基础指导，二胎妈妈需要高效方法"
      },
      {
        id: 33,
        text: "你的用户最反感什么样的营销方式？",
        type: "text",
        placeholder: "例如：硬广告、虚假承诺、过度推销"
      },
      {
        id: 34,
        text: "你如何收集和分析用户反馈，并将其用于产品和内容的迭代？",
        type: "radio",
        options: [
          { value: 1, label: "从不收集" },
          { value: 2, label: "偶尔收集，很少分析" },
          { value: 3, label: "定期收集，简单分析" },
          { value: 4, label: "系统收集，深度分析" },
          { value: 5, label: "实时收集，智能分析" }
        ]
      },
      {
        id: 35,
        text: "你的用户愿意为'节省时间'、'减少痛苦'还是'增加快乐'付费？优先级如何？",
        type: "text",
        placeholder: "例如：首先是减少痛苦，其次是节省时间"
      },
      {
        id: 36,
        text: "你的用户在实现他们的目标过程中，最容易在哪一步放弃？",
        type: "text",
        placeholder: "例如：开始第二周，新鲜感过去后"
      },
      {
        id: 37,
        text: "你的用户在购买你的产品后，他们向朋友介绍时会怎么说？",
        type: "text",
        placeholder: "例如：这个课程真的很实用，老师讲得特别清楚"
      },
      {
        id: 38,
        text: "你如何识别并奖励你最忠实的'铁杆粉丝'？",
        type: "radio",
        options: [
          { value: 1, label: "没有识别机制" },
          { value: 2, label: "简单识别，无奖励" },
          { value: 3, label: "基本识别和奖励" },
          { value: 4, label: "系统识别，定期奖励" },
          { value: 5, label: "智能识别，个性化奖励" }
        ]
      },
      {
        id: 39,
        text: "你的用户在没有你帮助的情况下，实现目标的可能性有多大？",
        type: "radio",
        options: [
          { value: 1, label: "几乎不可能" },
          { value: 2, label: "可能性很小" },
          { value: 3, label: "有一定可能" },
          { value: 4, label: "可能性较大" },
          { value: 5, label: "完全可以自己实现" }
        ]
      },
      {
        id: 40,
        text: "你的用户最崇拜或关注的KOL/IP是谁？他们的共同点是什么？",
        type: "text",
        placeholder: "例如：关注papi酱、李佳琦，都很有个人特色"
      }
    ]
  },
  product: {
    title: "产品 (Product)",
    description: "你卖什么？打造无法抗拒的价值主张。",
    questions: [
      {
        id: 41,
        text: "完整地画出你的价值阶梯，从免费的流量磁石到最贵的高客单价产品。",
        type: "text",
        placeholder: "例如：免费电子书→99元入门课→999元系统课→9999元一对一"
      },
      {
        id: 42,
        text: "你的核心产品承诺为用户带来哪个具体、可衡量的结果？",
        type: "text",
        placeholder: "例如：30天内减重5公斤，而不是'变得更健康'"
      },
      {
        id: 43,
        text: "你的产品如何通过提供转型和社群价值，来对抗市场复购率下降的趋势？",
        type: "text",
        placeholder: "例如：建立学员社群，提供持续支持和交流"
      },
      {
        id: 44,
        text: "你的流量磁石产品是否足够有吸引力，让用户愿意用他们的联系方式来交换？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有吸引力" },
          { value: 2, label: "吸引力较小" },
          { value: 3, label: "一般吸引力" },
          { value: 4, label: "比较有吸引力" },
          { value: 5, label: "非常有吸引力" }
        ]
      },
      {
        id: 45,
        text: "你的绊脚石产品（低价产品）如何为你的核心产品做铺垫和信任积累？",
        type: "text",
        placeholder: "例如：通过低价体验课展示教学质量"
      },
      {
        id: 46,
        text: "你的产品交付形式是否符合你目标用户的使用习惯？",
        type: "radio",
        options: [
          { value: 1, label: "完全不符合" },
          { value: 2, label: "基本不符合" },
          { value: 3, label: "一般符合" },
          { value: 4, label: "比较符合" },
          { value: 5, label: "完全符合" }
        ]
      },
      {
        id: 47,
        text: "你如何设计产品的'惊喜时刻'，超出用户的预期？",
        type: "text",
        placeholder: "例如：赠送额外的一对一咨询机会"
      },
      {
        id: 48,
        text: "你的产品定价策略是什么？是基于成本、竞争还是价值？",
        type: "radio",
        options: [
          { value: 1, label: "基于成本定价" },
          { value: 2, label: "基于竞争定价" },
          { value: 3, label: "成本竞争并重" },
          { value: 4, label: "主要基于价值" },
          { value: 5, label: "完全基于价值" }
        ]
      },
      {
        id: 49,
        text: "你的高客单价产品提供了哪些核心产品无法替代的价值？",
        type: "text",
        placeholder: "例如：个性化定制方案、一对一指导、VIP社群"
      },
      {
        id: 50,
        text: "你的产品组合中，哪个是流量型产品，哪个是利润型产品？",
        type: "text",
        placeholder: "例如：免费课程引流，高价咨询盈利"
      },
      {
        id: 51,
        text: "你如何确保你的课程或服务能够被用户完成并产生效果？",
        type: "text",
        placeholder: "例如：设置打卡机制、作业反馈、社群督促"
      },
      {
        id: 52,
        text: "你的产品是否有清晰的更新迭代计划？",
        type: "radio",
        options: [
          { value: 1, label: "没有任何计划" },
          { value: 2, label: "偶尔更新" },
          { value: 3, label: "有基本计划" },
          { value: 4, label: "有详细计划" },
          { value: 5, label: "有系统化迭代机制" }
        ]
      },
      {
        id: 53,
        text: "你的产品命名是否简单、易记，并能直接反映其核心价值？",
        type: "radio",
        options: [
          { value: 1, label: "完全不符合" },
          { value: 2, label: "基本不符合" },
          { value: 3, label: "一般" },
          { value: 4, label: "比较符合" },
          { value: 5, label: "完全符合" }
        ]
      },
      {
        id: 54,
        text: "你如何构建产品的护城河，防止被轻易模仿？",
        type: "text",
        placeholder: "例如：独特的方法论、强大的社群、个人IP"
      },
      {
        id: 55,
        text: "你的产品是否包含社群元素？这个社群的核心价值是什么？",
        type: "text",
        placeholder: "例如：学员互相监督、经验分享、持续激励"
      },
      {
        id: 56,
        text: "你的产品是否提供了不同层次的解决方案，以满足不同支付能力用户的需求？",
        type: "radio",
        options: [
          { value: 1, label: "只有单一产品" },
          { value: 2, label: "有2个层次" },
          { value: 3, label: "有3个层次" },
          { value: 4, label: "有4个层次" },
          { value: 5, label: "有5个或更多层次" }
        ]
      },
      {
        id: 57,
        text: "你如何向潜在客户证明你的产品是有效的？",
        type: "text",
        placeholder: "例如：学员案例、数据统计、专业认证"
      },
      {
        id: 58,
        text: "你的产品退款政策是什么？它如何体现你对产品价值的信心？",
        type: "text",
        placeholder: "例如：7天无理由退款，体现对产品质量的信心"
      },
      {
        id: 59,
        text: "你的产品体系是否能自然地引导用户进行复购或增购？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有引导" },
          { value: 2, label: "很少引导" },
          { value: 3, label: "有一些引导" },
          { value: 4, label: "有较好引导" },
          { value: 5, label: "有完善的引导体系" }
        ]
      },
      {
        id: 60,
        text: "如果你必须将现有产品砍掉80%，你会保留哪20%？为什么？",
        type: "text",
        placeholder: "例如：保留核心课程，因为它是最有价值的部分"
      }
    ]
  },
  platform: {
    title: "流量 (Platform)",
    description: "你在哪里找到他们？你的内容与分发策略。",
    questions: [
      {
        id: 61,
        text: "你的主要'种草'平台和主要'转化'平台分别是什么？",
        type: "text",
        placeholder: "例如：小红书种草，微信转化"
      },
      {
        id: 62,
        text: "详细描述你的公域-私域联动漏斗流程。",
        type: "text",
        placeholder: "例如：抖音视频→个人简介→微信→朋友圈→课程销售"
      },
      {
        id: 63,
        text: "你在每个核心平台的内容策略有何不同？",
        type: "text",
        placeholder: "例如：抖音做娱乐化科普，小红书做深度解决方案"
      },
      {
        id: 64,
        text: "你如何利用平台的算法规则来最大化你的内容曝光？",
        type: "radio",
        options: [
          { value: 1, label: "完全不了解算法" },
          { value: 2, label: "了解一点，很少应用" },
          { value: 3, label: "基本了解，偶尔应用" },
          { value: 4, label: "比较了解，经常应用" },
          { value: 5, label: "深度了解，系统应用" }
        ]
      },
      {
        id: 65,
        text: "你获取一个私域用户的平均成本是多少？你计划如何降低它？",
        type: "text",
        placeholder: "例如：目前50元/人，计划通过优化内容降到30元"
      },
      {
        id: 66,
        text: "你在私域的内容发布频率和节奏是怎样的？",
        type: "text",
        placeholder: "例如：朋友圈每天2条，微信群每周3次互动"
      },
      {
        id: 67,
        text: "你是否建立了内容创作的SOP？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有SOP" },
          { value: 2, label: "有简单流程" },
          { value: 3, label: "有基本SOP" },
          { value: 4, label: "有详细SOP" },
          { value: 5, label: "有完善的SOP体系" }
        ]
      },
      {
        id: 68,
        text: "你如何平衡原创内容和二次创作/聚合内容的比例？",
        type: "text",
        placeholder: "例如：70%原创，30%二次创作"
      },
      {
        id: 69,
        text: "你的内容分发矩阵是怎样的？如何实现一稿多发？",
        type: "text",
        placeholder: "例如：一个选题在抖音、小红书、公众号分别发布"
      },
      {
        id: 70,
        text: "你是否与其他创作者或KOL进行合作？你的合作标准是什么？",
        type: "text",
        placeholder: "例如：与同领域博主互推，要求粉丝量相当"
      },
      {
        id: 71,
        text: "你如何衡量内容营销的ROI？",
        type: "radio",
        options: [
          { value: 1, label: "从不衡量ROI" },
          { value: 2, label: "偶尔看看数据" },
          { value: 3, label: "定期分析基本指标" },
          { value: 4, label: "系统分析多维指标" },
          { value: 5, label: "精细化ROI分析" }
        ]
      },
      {
        id: 72,
        text: "你是否有付费投流的计划？预算和测试策略是怎样的？",
        type: "text",
        placeholder: "例如：每月投流预算5000元，先测试小红书信息流"
      },
      {
        id: 73,
        text: "你的个人IP在公域平台和私域平台呈现的形象有何细微差别？",
        type: "text",
        placeholder: "例如：公域更专业权威，私域更亲近真实"
      },
      {
        id: 74,
        text: "你如何通过内容引导用户从'被动浏览'转变为'主动搜索'你的品牌？",
        type: "text",
        placeholder: "例如：在内容中植入品牌关键词，引导搜索"
      },
      {
        id: 75,
        text: "你如何利用微信视频号、公众号、朋友圈、社群形成联动效应？",
        type: "text",
        placeholder: "例如：视频号引流到公众号，公众号导入社群"
      },
      {
        id: 76,
        text: "你是否有计划通过SEO获取百度的自然搜索流量？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有计划" },
          { value: 2, label: "有想法但没行动" },
          { value: 3, label: "开始尝试" },
          { value: 4, label: "有系统规划" },
          { value: 5, label: "已有成熟策略" }
        ]
      },
      {
        id: 77,
        text: "你的内容选题机制是怎样的？",
        type: "text",
        placeholder: "例如：基于用户提问+热点追踪+数据分析"
      },
      {
        id: 78,
        text: "你如何将每一个公域内容都设计成一个私域引流的钩子？",
        type: "text",
        placeholder: "例如：在内容末尾提供免费资料，引导加微信"
      },
      {
        id: 79,
        text: "你如何激活沉默的私域用户？",
        type: "text",
        placeholder: "例如：定期发送有价值内容，举办线上活动"
      },
      {
        id: 80,
        text: "你的内容是否形成了独特的风格和记忆点？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有特色" },
          { value: 2, label: "有一点特色" },
          { value: 3, label: "有基本风格" },
          { value: 4, label: "有鲜明风格" },
          { value: 5, label: "有强烈个人标识" }
        ]
      }
    ]
  },
  process: {
    title: "体系 (Process)",
    description: "你如何交付与增长？业务背后的系统。",
    questions: [
      {
        id: 81,
        text: "你的内容创作和客户服务流程中，哪些部分可以被自动化或系统化？",
        type: "text",
        placeholder: "例如：客户咨询自动回复，内容发布定时推送"
      },
      {
        id: 82,
        text: "你如何衡量客户终身价值（LTV）？",
        type: "radio",
        options: [
          { value: 1, label: "从不计算LTV" },
          { value: 2, label: "偶尔估算" },
          { value: 3, label: "定期计算" },
          { value: 4, label: "系统跟踪" },
          { value: 5, label: "精确建模预测" }
        ]
      },
      {
        id: 83,
        text: "描述你从获取一个新用户到完成首次销售的完整流程。",
        type: "text",
        placeholder: "例如：内容吸引→加微信→朋友圈培育→课程推广→成交"
      },
      {
        id: 84,
        text: "你是否建立了客户标签体系，以便进行精细化运营？",
        type: "radio",
        options: [
          { value: 1, label: "没有任何标签" },
          { value: 2, label: "简单分类" },
          { value: 3, label: "基本标签体系" },
          { value: 4, label: "详细标签体系" },
          { value: 5, label: "智能标签系统" }
        ]
      },
      {
        id: 85,
        text: "你的团队每周/每月的工作SOP是怎样的？",
        type: "text",
        placeholder: "例如：周一选题策划，周二内容创作，周三发布推广"
      },
      {
        id: 86,
        text: "你使用了哪些工具来提高你的运营效率？",
        type: "text",
        placeholder: "例如：创客贴做图，剪映剪视频，企业微信管理客户"
      },
      {
        id: 87,
        text: "你如何管理你的知识库和素材库？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有管理" },
          { value: 2, label: "简单文件夹分类" },
          { value: 3, label: "基本分类管理" },
          { value: 4, label: "系统化管理" },
          { value: 5, label: "智能化知识库" }
        ]
      },
      {
        id: 88,
        text: "你的财务模型是怎样的？包括收入预测、成本结构和利润目标。",
        type: "text",
        placeholder: "例如：月收入目标10万，成本30%，利润率70%"
      },
      {
        id: 89,
        text: "你如何处理客户的投诉和负面反馈？",
        type: "text",
        placeholder: "例如：24小时内回复，主动解决问题，建立反馈机制"
      },
      {
        id: 90,
        text: "你是否有清晰的数据分析看板？你关注的核心数据指标是什么？",
        type: "text",
        placeholder: "例如：关注粉丝增长率、转化率、客单价、复购率"
      },
      {
        id: 91,
        text: "你如何为你的付费社群设定规则并维护良好的社区氛围？",
        type: "text",
        placeholder: "例如：制定群规，定期互动，处理违规行为"
      },
      {
        id: 92,
        text: "你是否有备份计划来应对平台风险？",
        type: "radio",
        options: [
          { value: 1, label: "完全没有备份" },
          { value: 2, label: "有简单备份" },
          { value: 3, label: "有基本应急预案" },
          { value: 4, label: "有详细风险预案" },
          { value: 5, label: "有完善的风险管理体系" }
        ]
      },
      {
        id: 93,
        text: "你如何进行时间管理，以平衡内容创作、产品交付、用户运营和个人成长？",
        type: "text",
        placeholder: "例如：上午创作，下午运营，晚上学习"
      },
      {
        id: 94,
        text: "你是否了解相关的法律法规？",
        type: "radio",
        options: [
          { value: 1, label: "完全不了解" },
          { value: 2, label: "了解一点" },
          { value: 3, label: "基本了解" },
          { value: 4, label: "比较了解" },
          { value: 5, label: "非常了解" }
        ]
      },
      {
        id: 95,
        text: "你的业务扩张计划是什么？",
        type: "text",
        placeholder: "例如：先深化现有领域，再拓展到相关领域"
      },
      {
        id: 96,
        text: "你如何持续学习和提升自己？",
        type: "text",
        placeholder: "例如：每周读书，参加行业会议，向同行学习"
      },
      {
        id: 97,
        text: "你是否为你的业务设定了季度和年度的OKR？",
        type: "radio",
        options: [
          { value: 1, label: "从不设定目标" },
          { value: 2, label: "偶尔设定目标" },
          { value: 3, label: "定期设定基本目标" },
          { value: 4, label: "系统设定OKR" },
          { value: 5, label: "精细化OKR管理" }
        ]
      },
      {
        id: 98,
        text: "你如何管理你的精力，避免职业倦怠？",
        type: "text",
        placeholder: "例如：定期休息，运动健身，培养兴趣爱好"
      },
      {
        id: 99,
        text: "你的业务中，最大的瓶颈是什么？",
        type: "text",
        placeholder: "例如：流量获取、转化率低、产品交付能力不足"
      },
      {
        id: 100,
        text: "如果从零开始，根据你现在的认知，你会做的三件最不一样的事情是什么？",
        type: "text",
        placeholder: "例如：1.更早建立私域 2.专注细分领域 3.重视数据分析"
      }
    ]
  }
};

// 评分标准
export const scoringCriteria = {
  purpose: {
    weight: 0.2,
    description: "定位清晰度和独特性"
  },
  people: {
    weight: 0.2,
    description: "用户理解深度"
  },
  product: {
    weight: 0.2,
    description: "产品价值和体系化"
  },
  platform: {
    weight: 0.2,
    description: "流量策略和执行力"
  },
  process: {
    weight: 0.2,
    description: "系统化和可规模化"
  }
};

// 等级定义
export const levelDefinitions = {
  beginner: { min: 0, max: 40, label: "新手", color: "#ef4444" },
  intermediate: { min: 41, max: 60, label: "进阶", color: "#f97316" },
  advanced: { min: 61, max: 80, label: "专家", color: "#eab308" },
  expert: { min: 81, max: 100, label: "大师", color: "#22c55e" }
};

