# DramaAI — AI 短剧生成平台

面向香港与海外用户的现代 AI 短剧生成平台，基于 Next.js 15 App Router。

## 技术栈

- **Next.js 15** + TypeScript + App Router
- **Tailwind CSS** + **shadcn/ui** + Dark Mode
- **next-intl** — 简体中文 / 繁体中文 / English
- **Clerk** — 认证与用户管理

## 快速开始

```bash
npm install
cp .env.example .env.local
# 填入 Clerk keys: https://dashboard.clerk.com
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)（默认跳转至 `/zh-HK`）。

## 项目结构

```
app/
  [locale]/
    layout.tsx          # i18n + Clerk + Theme
    (main)/
      page.tsx          # 首页（生成器 + 预览）
components/
  header/               # 顶部导航
  generator/            # 故事输入、图片上传、风格选择
  preview/              # 生成结果预览
  ui/                   # shadcn 组件
i18n/                   # next-intl 路由与导航
messages/               # zh-CN / zh-HK / en 文案
lib/                    # 工具与常量
middleware.ts           # Clerk + next-intl
```

## 环境变量

见 [.env.example](.env.example)。
