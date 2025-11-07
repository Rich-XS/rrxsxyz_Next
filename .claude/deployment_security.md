# Deployment, Security & Design

部署架构、安全规范与设计指南

---

## 安全注意事项

1. **永远不要提交 `.env` 文件到版本控制**
2. **API密钥通过环境变量配置，不要硬编码**
3. **后端已配置速率限制（15分钟100请求）和Helmet安全头**
4. **生产环境需启用CSP（当前开发环境已禁用）**

---

## 部署架构

**当前（本地开发）：**
- 前端：Python HTTP Server (:8080)
- 后端：Node.js Express (:3000)
- 数据：本地JSON文件 + OneDrive同步

**生产环境建议：**
- 域名：rrxs.xyz
- 服务器：腾讯云轻量（2核4G，￥112/年）
- 反向代理：Nginx + Let's Encrypt SSL
- CDN：腾讯云CDN（静态资源加速）
- 进程管理：PM2
- 备份：OneDrive + Syncthing + GitHub私有仓库

---

## 性能优化目标

- 首屏加载时间 < 2秒
- Lighthouse评分 > 90
- 移动端适配优先（响应式设计）
- 懒加载图片和组件
- Service Worker离线缓存（待实现）

---

## 联系与资源

- **网站主页：** rrxs.xyz
- **问题反馈：** 通过网站"论坛&留言"提交
- **项目维护者：** 百问学长-RRXS

---

## 设计规范（全局要求）

### 苹果风格设计规范

**核心原则：所有界面遵循苹果/Apple公司风格，优美！**

适用范围：
- 多魔汰系统（duomotai/）
- 百问自测系统（html/projects/media-assessment-*.html）
- 所有前端界面（index.html、baiwen.html、Projects.html）

**设计要点：**
1. **简洁性**：简洁明了，去除冗余元素
2. **圆角**：所有卡片、按钮、输入框使用圆角设计（推荐 12px-16px）
3. **柔和阴影**：使用柔和的投影效果，避免生硬边框
4. **高品质字体**：优先使用 SF Pro Display / SF Pro Text / -apple-system
5. **渐变色**：适当使用渐变色增强视觉层次
6. **响应式**：所有界面必须支持移动端自适应
7. **动画**：使用流畅的过渡动画（transition/transform）
8. **留白**：充分利用空白区域，避免拥挤

**颜色方案（多魔汰系统）：**
- 核心蓝：#007AFF（iOS 系统蓝）
- 外部红：#FF3B30（iOS 警告红）
- 价值绿：#34C759（iOS 成功绿）
- 背景暖米白：#FFFAF0（模态框背景）

**参考组件库：**
- TailwindCSS（工具类）
- Material Design（卡片动画）
- Apple Human Interface Guidelines（设计规范）

---

**Last Updated**: 2025-10-11 15:36 (GMT+8) - CLAUDE.md 模块化：部署与设计模块创建
