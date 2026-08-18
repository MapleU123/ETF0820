# 网格做T记录器 (Grid Trade T-Recorder)

专业基金与 ETF 网格交易、日内做T记录器，支持做T成本摊薄、日历看板、收益分析与 AI 拍照识单，支持 PWA 离线安装与移动端原生体验。

---

## 🚀 本地开发与运行 (Local Run)

### 1. 环境准备
确保您的电脑上已安装 [Node.js](https://nodejs.org/) (推荐版本 v18 或更高)。

### 2. 安装依赖
在项目根目录解压后打开终端（Terminal / CMD / PowerShell），运行：
```bash
npm install
```

### 3. 本地启动开发服务器
```bash
npm run dev
```
启动成功后，在浏览器访问：**`http://localhost:3000`**

*(可选) 如需配置 AI 拍照智能识单功能，请在根目录创建 `.env` 文件并填入您的 Gemini API Key：*
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🌐 部署上线指南

### 选项 A：部署到 Netlify / Vercel (纯静态托管)
1. 运行本地打包命令：
   ```bash
   npm run build:client
   ```
2. 打包完成后，项目根目录会生成一个 **`dist`** 文件夹。
3. 打开 [Netlify 官网](https://app.netlify.com/drop)，将 **`dist`** 文件夹直接拖拽到页面中即可完成秒级部署上线！

### 选项 B：推送到 GitHub + Netlify 自动化部署
1. 将本项目推送到 GitHub。
2. 在 Netlify 选择 **Import from Git**。
3. 设置构建参数：
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist`
4. 点击 **Deploy Site** 即可自动构建并生成线上域名。

---

## 📱 打包为安卓手机 App (.apk)

1. 在项目根目录下安装 Capacitor：
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. 初始化并添加 Android 平台：
   ```bash
   npx cap init "网格做T记录器" "com.gridtrade.app" --web-dir dist
   npm run build:client
   npx cap add android
   npx cap copy
   ```
3. 生成 APK：
   ```bash
   npx cap open android
   ```
   在 Android Studio 中点击 **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** 即可获取安装包。

---

## 💡 功能特性
- 📅 **日历看板**：月度做T收益热力图、每日明细抽屉展开。
- 💼 **持仓总览**：做T及分红摊薄后真实持仓成本对比、实时市值估值与网格阶梯算利器。
- ⚡ **T统计分析**：成对套利明细、胜率分析、各标的获利榜、FIFO 智能自动配对。
- 📈 **收益看板**：做T与分红累计收益曲线、月度收益对比柱状图、标的贡献环形图。
- 💰 **分红管理**：现金分红与红利再投资流水记录及成本冲减。
- 📝 **录入中心**：手工快捷做T算利录入、CSV 批量导入、相册截图与摄像头实时拍照 AI 识别（OCR）。
- 🔒 **数据安全**：纯本地持久化，支持全量 JSON 一键导出与导入备份。
