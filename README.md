# Brevo Email OTP Login Demo

一个本地可运行的邮箱 OTP 登录示例项目，使用 `Express` 提供后端接口，使用 `React + Vite` 提供前端页面，并通过 `Brevo` 发送真实邮件验证码。

## 技术栈
- Node.js 24+
- Express
- React + Vite
- SQLite（使用 Node.js 内置 `node:sqlite`）
- Brevo Transactional Email API

## 功能
- 输入邮箱并请求 OTP
- 使用邮箱 + OTP 登录
- 服务端会话保持
- 查询当前登录状态
- 退出登录
- 开发环境调试接口读取最新 OTP
- 自动化脚本验证完整登录链路

## 环境变量
复制 `.env.example` 为 `.env`，并至少填写以下配置：

```bash
APP_ENV=development
PORT=45678
HOST=127.0.0.1
SESSION_SECRET=change-this-session-secret
DEV_API_TOKEN=change-this-dev-api-token
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=verified-sender@example.com
BREVO_SENDER_NAME=Brevo OTP Demo
OTP_TTL_SECONDS=600
SESSION_TTL_SECONDS=86400
OTP_RESEND_COOLDOWN_SECONDS=60
```

## 安装依赖
```bash
npm install
```

## 本地开发
```bash
npm run dev
```

- 前端默认运行在 `http://localhost:5173`
- 后端默认运行在 `http://127.0.0.1:45678`
- Vite 会将 `/api` 代理到后端

## 生产构建与运行
```bash
npm run build
npm run start
```

## 自动化测试脚本
在后端服务运行后，执行：

macOS / Linux / Git Bash：

```bash
TEST_EMAIL=you@example.com DEV_API_TOKEN=change-this-dev-api-token npm run test:flow
```

Windows CMD：

```bat
set TEST_EMAIL=you@example.com&& set DEV_API_TOKEN=change-this-dev-api-token&& npm run test:flow
```

如需指定后端地址，可额外设置：

```bash
BASE_URL=http://127.0.0.1:45678
```

## Brevo 发信说明
- 发信接口使用 `POST https://api.brevo.com/v3/smtp/email`
- 请求头使用：
  - `accept: application/json`
  - `api-key: YOUR_API_KEY`
  - `content-type: application/json`
- 请求体使用 `sender`、`to`、`subject`、`htmlContent`
- 这一实现只使用 `htmlContent`，不混用 `textContent` 或 `templateId`
