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

说明：
- `.env` 只保留在本地，不要提交到 GitHub。
- `BREVO_API_KEY` 必须使用你自己的 Brevo API Key。
- `BREVO_SENDER_EMAIL` 必须是你在 Brevo 里已经验证通过的 sender 邮箱。
- `DEV_API_TOKEN` 仅用于开发测试脚本访问 `/api/dev/latest-otp`。

## 安装依赖
```bash
npm install
```

## 从 GitHub 复现
如果另一个开发者要从 GitHub 仓库直接复现项目，推荐按下面流程操作：

1. 克隆仓库
```bash
git clone <your-repo-url>
cd Brevo-login-demo
```

2. 安装依赖
```bash
npm install
```

3. 复制环境变量模板
```bash
cp .env.example .env
```

Windows 也可以直接手动复制 `.env.example` 为 `.env`。

4. 在 `.env` 中填写自己的配置
- `APP_ENV=development`
- `HOST=127.0.0.1`
- `PORT=45678` 或任何本机空闲端口
- `DEV_API_TOKEN=自定义本地测试令牌`
- `BREVO_API_KEY=自己的 Brevo API Key`
- `BREVO_SENDER_EMAIL=自己的已验证 sender 邮箱`
- `BREVO_SENDER_NAME=自己的 sender 名称`

5. 启动项目
```bash
npm run dev
```

6. 另开一个终端执行测试脚本
- PowerShell：

```powershell
$env:TEST_EMAIL="you@example.com"; $env:DEV_API_TOKEN="your-local-token"; npm run test:flow
```

- Windows CMD：

```bat
set TEST_EMAIL=you@example.com&& set DEV_API_TOKEN=your-local-token&& npm run test:flow
```

- macOS / Linux / Git Bash：

```bash
TEST_EMAIL=you@example.com DEV_API_TOKEN=your-local-token npm run test:flow
```

## 给其他开发者的前置条件
仓库本身不足以完成真实发信测试，复现者还需要自己准备：

- Node.js 24+
- 一个可用的 Brevo 账号
- 一个已验证的 Brevo sender
- 一个可接收 OTP 的真实邮箱


## 本地开发
```bash
npm run dev
```

- 前端默认运行在 `http://localhost:5173`
- 后端运行地址跟随 `.env` 中的 `HOST` 和 `PORT`
- Vite 会自动把 `/api` 代理到 `.env` 对应的后端地址
- 后端开发模式只监听 `server/src` 和 `.env` 变更，不会因为 SQLite 数据文件写入而自动重启

## 生产构建与运行
```bash
npm run build
npm run start
```

如果想模拟真实用户而不是开发调试：
- 把 `.env` 中的 `APP_ENV` 改为 `production`
- 执行 `npm run build` 和 `npm run start`
- 打开 `http://HOST:PORT`
- 手动输入邮箱、接收真实邮件 OTP、再完成登录

注意：
- 当前自动化测试脚本依赖开发接口 `/api/dev/latest-otp`
- 在 `APP_ENV=production` 下，这个接口会被禁用
- 所以自动化脚本适用于开发环境，不适用于生产模拟

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

PowerShell：

```powershell
$env:TEST_EMAIL="you@example.com"; $env:DEV_API_TOKEN="change-this-dev-api-token"; npm run test:flow
```

如需指定后端地址，可额外设置：

```bash
BASE_URL=http://127.0.0.1:45678
```

如果你修改了 `.env` 里的 `PORT`，测试脚本默认也会自动跟随，不需要再单独改代码。

测试脚本当前验证的是开发模式下的完整链路：
- 请求发送 OTP
- 通过开发接口读取最新 OTP
- 用错误 OTP 验证拒绝逻辑
- 用正确 OTP 登录
- 检查当前登录状态
- 退出登录
- 再次确认用户已退出

注意：
- 同一个邮箱在冷却时间内重复请求 OTP 会返回 `429`
- 如果刚在网页里点过“发送 OTP”，马上运行脚本可能会因为冷却而失败
- 遇到这种情况，等待 60 秒或换一个邮箱别名再测

## Brevo 发信说明
- 发信接口使用 `POST https://api.brevo.com/v3/smtp/email`
- 请求头使用：
  - `accept: application/json`
  - `api-key: YOUR_API_KEY`
  - `content-type: application/json`
- 请求体使用 `sender`、`to`、`subject`、`htmlContent`
- 这一实现只使用 `htmlContent`，不混用 `textContent` 或 `templateId`
