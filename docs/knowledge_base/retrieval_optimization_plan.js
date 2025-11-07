// Retrieval Algorithm Optimization
// 当前准确率：100%（基线） → 目标95%+（考虑复杂查询）

const retrievalOptimizations = {
  version: "2.0-optimization",
  timestamp: "2025-11-06T05:55:00+08:00",

  current_baselines: {
    keyword_search: {
      accuracy: "100% (4/4 simple queries)",
      weakness: "复杂查询/跨类别查询准确率可能下降",
      example_gap: "查询'批处理安全'应同时匹配D-102+D-107+SOL-FS-001"
    },
    pattern_matching: {
      accuracy: "100% (4/4 pattern detection)",
      weakness: "未考虑上下文和模式组合"
    },
    similarity_search: {
      accuracy: "需要更多测试数据",
      weakness: "Jaccard相似度可能过于简单"
    }
  },

  optimization_strategies: {
    "策略1：加权关键词搜索": {
      description: "不同关键词的权重不同",
      implementation: {
        "P0关键词": 3,  // 灾难, 根本原因, 系统级
        "P1关键词": 2,  // 优化, 性能, 工具选型
        "P2关键词": 1   // 其他
      },
      expected_improvement: "+5%准确率（对P0问题更敏感）"
    },

    "策略2：跨库联合搜索": {
      description: "同时搜索decisions/patterns/solutions/constraints",
      current_issue: "只在单个库内搜索",
      implementation: {
        step1: "在decisions库搜索",
        step2: "获取相关决策涉及的patterns",
        step3: "从patterns推导相关solutions",
        step4: "添加相关constraints作为注意事项"
      },
      expected_improvement: "+10%准确率（发现相关但隐含的知识）"
    },

    "策略3：自然语言理解（NLP）": {
      description: "理解查询的语义，而非字面匹配",
      techniques: [
        "词向量（Word2Vec/GloVe）：将词转换为向量",
        "语义相似度：计算查询和决策标题的语义距离",
        "实体识别（NER）：提取关键词（如问题类型、组件名）"
      ],
      example: {
        query: "怎样防止NUL文件增长",
        entities: ["NUL文件", "预防"],
        should_match: ["D-102", "D-107", "SOL-FS-001", "D-108维护脚本"]
      },
      expected_improvement: "+15%准确率"
    },

    "策略4：上下文感知排序": {
      description: "根据当前系统状态调整搜索结果排序",
      context_factors: [
        "用户当前在哪个模块（duomotai/server/scripts）",
        "最近执行的Agent（灾难预防/检索/推理）",
        "系统当前状态（成功率/错误率）"
      ],
      implementation: "动态调整搜索结果权重",
      expected_improvement: "+5%用户满意度"
    },

    "策略5：用户反馈循环": {
      description: "记录用户是否找到想要的结果",
      implementation: {
        step1: "为每个搜索结果添加'有用/无用'反馈按钮",
        step2: "记录反馈到execution_results.json",
        step3: "每周基于反馈调整关键词权重和排序"
      },
      expected_improvement: "+20%长期准确率（自适应改进）"
    }
  },

  quick_wins: [
    {
      name: "添加同义词字典",
      effort: "1小时",
      impact: "+3%",
      example: {
        query: "端口冲突",
        synonyms: ["port conflict", "port occupied", "3001被占用"]
      }
    },
    {
      name: "改进模式关键词权重",
      effort: "30分钟",
      impact: "+2%",
      detail: "当前权重固定，改为动态调整"
    },
    {
      name": "添加分类过滤",
      effort": "1小时",
      impact": "+4%",
      example": "允许用户指定搜索范围（decisions/patterns/solutions）"
    },
    {
      name: "跨库搜索聚合",
      effort: "2小时",
      impact: "+8%",
      detail: "实现完整的跨库联合查询"
    }
  ],

  implementation_roadmap: {
    phase1_immediate: "添加同义词字典 + 改进权重 + 分类过滤 (预期+9%, 3小时工作)",
    phase2_week1: "跨库搜索聚合 + 上下文感知排序 (预期+15%, 4小时工作)",
    phase3_week2: "集成NLP库 (spacy/nltk) 进行语义搜索 (预期+20%, 6小时工作)",
    phase4_ongoing: "用户反馈循环 + 长期自适应优化"
  }
};

module.exports = {
  strategies: retrievalOptimizations.optimization_strategies,
  quickWins: retrievalOptimizations.quick_wins,
  roadmap: retrievalOptimizations.implementation_roadmap,
  targets: {
    short_term: "3周内准确率95% (当前100% baseline → 实际场景95%)",
    medium_term: "1个月内用户满意度90% (考虑复杂查询)",
    long_term: "持续通过用户反馈自适应优化"
  }
};
