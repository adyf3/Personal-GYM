# 健身容量记录

一款本地优先的移动端网页应用，用于记录每日无氧训练、有氧训练容量，并查看趋势、动作最高记录和训练明细。

应用面向 iPhone Safari / PWA 使用，无需后端、无需账号，训练数据默认保存在当前设备的浏览器本地存储中。
<img width="1430" height="1100" alt="健身容量记录网页应用_UX效果图_v3" src="https://github.com/user-attachments/assets/4c1fceb2-b14d-4cbc-bf68-7690493a8e89" />

## 功能特性

- 今日训练记录
  - 支持无氧训练和有氧训练
  - 部位通过下拉选项选择
  - 动作名称通过下拉选项选择
  - 今日训练可编辑
  - 往期训练只读

- 训练确认机制
  - 今日训练修改后进入“待确认”状态
  - 点击“确认今日训练”后，数据同步进入趋势统计
  - 修改已确认数据后，需要重新确认

- 自动日期同步
  - 默认跟随系统当天日期
  - 跨天或重新打开应用时自动回到今天
  - 手动查看往期日期时进入只读查看

- 趋势图
  - 支持按部位筛选：肩、胸、背、核心、手臂、腿
  - 支持按日、周、月查看
  - 展示无氧训练容量趋势
  - 展示有氧训练容量趋势
  - 点击日维度点位：查看当日每个动作的具体训练内容
  - 点击周/月维度点位：查看每个动作的训练容量总计

- 最高记录
  - 展示所有动作的单日最高容量记录
  - 点击确认今日训练后自动更新
  - 新增同一动作时，默认参数优先使用该动作最高记录对应参数

- PWA 支持
  - 支持添加到 iPhone 主屏幕
  - 支持基础离线缓存
  - 无需安装原生 App

## 技术栈

本项目是纯静态前端应用：

- HTML
- CSS
- JavaScript
- Canvas 折线图
- LocalStorage 本地数据存储
- Web App Manifest
- Service Worker

项目不依赖 npm、React、Vue 或后端服务。

## 项目结构

```text
.
├── index.html                         # 应用入口
├── styles.css                         # 页面样式
├── app.js                             # 核心逻辑
├── manifest.webmanifest               # PWA 配置
├── sw.js                              # Service Worker 离线缓存
├── icon.svg                           # 应用图标
├── 健身容量记录网页应用_PRD.md          # 产品需求文档
├── 健身容量记录网页应用_UX效果图.png
├── 健身容量记录网页应用_UX效果图_v2.png
└── 健身容量记录网页应用_UX效果图_v3.png
```

## 本地运行

进入项目目录：

```bash
cd /path/to/project
```

启动本地静态服务：

```bash
python3 -m http.server 8080
```

然后在浏览器打开：

```text
http://localhost:8080
```

如果希望 iPhone 在同一 Wi-Fi 下访问，需要绑定到局域网地址：

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

然后在 iPhone Safari 打开：

```text
http://你的Mac局域网IP:8080
```

例如：

```text
http://192.168.1.115:8080
```

## iPhone 使用方式

1. 确保 iPhone 和运行服务的电脑在同一个 Wi-Fi。
2. 用 iPhone Safari 打开应用地址。
3. 点击 Safari 分享按钮。
4. 选择“添加到主屏幕”。
5. 从主屏幕图标打开应用。

说明：

- 第一次加载必须联网或能访问部署地址。
- 添加到主屏幕后，Service Worker 会缓存静态资源。
- 如果部署在 HTTPS 地址上，PWA 和离线缓存体验会更稳定。

## 数据存储说明

训练数据保存在浏览器本地 `localStorage` 中。

这意味着：

- 数据不会上传服务器
- 不需要注册账号
- 不同设备之间不会自动同步
- 清除浏览器网站数据会导致训练记录丢失
- 换手机后数据不会自动迁移

当前本地存储键：

```text
fitness-volume-records-v1
fitness-volume-confirmed-dates-v1
```

## 部署方案

由于项目是纯静态文件，可以部署到任何静态网站托管平台。

推荐方案：

- Cloudflare Pages
- GitHub Pages
- Netlify
- Vercel

### GitHub Pages

适合直接从 GitHub 仓库发布。

基本步骤：

1. 创建 GitHub 仓库。
2. 上传本项目文件。
3. 进入仓库 Settings。
4. 找到 Pages。
5. 选择部署分支，例如 `main`。
6. 保存后等待 GitHub Pages 生成访问地址。

### Cloudflare Pages

适合长期使用，HTTPS 和 CDN 支持较好。

基本步骤：

1. 将代码推送到 GitHub。
2. 登录 Cloudflare。
3. 创建 Pages 项目。
4. 连接 GitHub 仓库。
5. 构建命令留空。
6. 输出目录选择根目录 `/`。
7. 部署。

## 开发说明

本项目没有构建流程，修改文件后刷新页面即可看到效果。

常用检查：

```bash
node --check app.js
python3 -m json.tool manifest.webmanifest
```

如果修改了 `app.js`、`styles.css` 或静态资源，建议同步更新 `sw.js` 中的缓存版本号：

```js
const CACHE_NAME = "fitness-volume-v3";
```

这样已经安装到主屏幕的 PWA 更容易获取新版本。

## 未来可扩展方向

- 数据导出 / 导入
- iCloud 或云端备份
- 多设备同步
- 自定义动作库
- 动作排序和隐藏
- 更丰富的有氧指标
- Apple Health / Google Fit 集成

## 注意事项

本应用当前定位为个人本地记录工具，不提供云备份。长期使用前，建议后续增加导出或备份功能，避免因清除浏览器数据导致训练记录丢失。
