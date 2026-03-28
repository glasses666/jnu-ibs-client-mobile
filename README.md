# JNU IBS Client (Mobile) 📱

<div align="center">

![App Icon](https://via.placeholder.com/150)

**暨南大学 IBS 智能水电查询助手 (Android 版)**

[![CI Status](https://img.shields.io/github/actions/workflow/status/glasses666/jnu-ibs-client-mobile/android.yml?style=flat-square&logo=github)](https://github.com/glasses666/jnu-ibs-client-mobile/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android-green.svg?style=flat-square&logo=android)](https://www.android.com/)
[![React](https://img.shields.io/badge/built%20with-React%20%2B%20Capacitor-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)

</div>

---

## 📖 简介 | Introduction

**JNU IBS Client** 是一款专为暨南大学学生打造的现代化水电费查询管理工具。

告别繁琐的网页登录和丑陋的界面，体验**极速**、**优雅**、**智能**的宿舍生活助手。不仅能实时监控水电用量，还内置了 AI 智能分析，为您提供省钱建议和充值规划。

> **核心特性**：无需连接校园网 VPN (通过 Cloudflare Tunnel / 内网穿透支持)，随时随地查看。

## ✨ 功能亮点 | Features

### 📊 核心功能
- **实时概览**：一屏掌握电费、冷水、热水余额及详细用量。
- **智能状态**：
  - 🟢 **服务正常** (Active)：余额充足。
  - 🟡 **建议充值** (Recommended)：余额 < 30元，呼吸灯提醒。
  - 🔴 **已欠费** (Offline)：余额耗尽，醒目红色警示。
- **精准数据**：所有数据精确到小数点后两位，支持“金额/用量”双模式切换。
- **补贴透视**：智能分离“充值余额”与“补贴余额”，清楚知道每一分钱去哪了。

### 🤖 AI 赋能 (Powered by Gemini / OpenAI)
- **每日简报**：每天打开 App，一句结合天气、季节和用量的暖心问候。
- **充值计算器**：
  - 自动分析近期日均消耗。
  - 智能扣除剩余补贴（专款专用）。
  - 计算出覆盖目标天数（如期末）所需的精确充值金额。
- **趋势解读**：AI 深度分析 7 天用量曲线，发现异常波动。

### 🎨 极致体验
- **现代化 UI**：采用 Bento 风格卡片布局，支持 **深色模式 (Dark Mode)** 自动切换。
- **流畅动画**：数字滚动 (CountUp)、页面转场、加载骨架屏，丝般顺滑。
- **天气集成**：自动获取所在校区天气，辅助决策（如气温骤降提醒多用热水）。
- **国际化**：完美支持 **简体中文** 与 **English** 切换。

## 📸 截图预览 | Screenshots

| 首页概览 | 趋势分析 | 智能计算器 | 设置界面 |
|:---:|:---:|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/300x600?text=Dashboard) | ![Trends](https://via.placeholder.com/300x600?text=Trends) | ![Calculator](https://via.placeholder.com/300x600?text=AI+Calc) | ![Settings](https://via.placeholder.com/300x600?text=Settings) |

## 🚀 安装指南 | Installation

### 方式一：直接下载 APK (推荐)
前往本项目的 [Releases](https://github.com/glasses666/jnu-ibs-client-mobile/releases) 页面下载最新版本的 `.apk` 安装包。

### 方式二：自行构建
如果您是开发者，可以克隆本项目自行编译：

```bash
# 1. 克隆仓库
git clone https://github.com/glasses666/jnu-ibs-client-mobile.git
cd jnu-ibs-client-mobile

# 2. 使用 Node 20
nvm use

# 3. 安装依赖
npm install

# 4. 运行 Web 预览
npm run dev

# 5. 构建 Web 资源
npm run build

# 6. 首次生成 Android 工程
npm run android:add

# 7. 后续同步 Android 资源
npm run android:sync
```

### 本地 Android 开发前提

- Node `20.x`
- JDK `17`
- Android Studio

> 仓库默认提交的是 Web 层代码；`android/` 目录会通过 Capacitor 在本地或 CI 中生成。

## ⚙️ 环境变量 | Environment Variables

项目支持通过 `.env.local` 覆盖默认配置，示例见 `.env.example`：

```bash
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WEATHER_API_ID=
VITE_WEATHER_API_KEY=
```

- 不配置 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 时，云同步入口会自动降级。
- 不配置天气 API 时，天气信息会自动关闭，不影响主查询流程。

## 🛠️ 技术栈 | Tech Stack

- **前端框架**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **移动端容器**: [Capacitor](https://capacitorjs.com/) (v5)
- **UI 样式**: Tailwind CDN + custom CSS
- **图标库**: [Lucide React](https://lucide.dev/)
- **图表库**: [Recharts](https://recharts.org/)
- **AI 支持**: Google Gemini API / OpenAI-compatible API

## 🤝 贡献 | Contributing

欢迎提交 Issue 或 Pull Request！
如果您发现 Bug 或有新的功能建议，请随时反馈。

## ⚠️ 免责声明 | Disclaimer

本项目仅供学习交流使用。
- 所有数据均来自用户自行输入的房间号查询结果。
- 本应用**不会**收集或上传您的任何个人隐私数据（API Key 仅存储在本地设备）。
- 请勿用于任何商业用途或恶意攻击学校服务器。

---

<div align="center">
Made with ❤️ by JNU Student
</div>
