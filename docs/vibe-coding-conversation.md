# Vibe Coding Conversation Record

> 本文件按时间顺序记录本次 Vibe Coding 过程中的关键对话、决策和验证结果。  
> 所有敏感信息都已脱敏，API Key、OTP、Cookie 和本地密钥均未写入仓库。

## 对话时间线

### 1. 项目目标确认
- 需求：从零开始实现一个本地可运行的 Email OTP Login Demo。
- 交付物：本地后端服务、前端页面、测试脚本，以及完整对话记录。
- 功能：请求 OTP、通过邮件发送 OTP、使用邮箱 + OTP 登录、保持会话、查询登录状态、退出登录。

### 2. 技术方案收敛
- 最初环境检查显示当前 WSL 侧没有可直接调用的 `node`。
- 进一步确认到 Windows 侧存在可用 Node.js，版本为 `v24.11.1`。
- 最终技术栈确定为：
  - `Node.js + Express`
  - `React + Vite`
  - `SQLite`
  - `Brevo`
- 决定只保留一个根目录 `package.json`，不拆多个子项目包。

### 3. Brevo 集成约束
- 明确要求：Brevo 发信格式必须严格参考本地 `brevo.md`。
- 实现时固定使用：
  - `POST https://api.brevo.com/v3/smtp/email`
  - `accept: application/json`
  - `api-key: YOUR_API_KEY`
  - `content-type: application/json`
- 请求体字段固定使用：
  - `sender`
  - `to`
  - `subject`
  - `htmlContent`
- 这次实现没有混用 `textContent` 或 `templateId`。

### 4. Git 与仓库要求
- 项目要求初始化为 git 仓库。
- 每完成一步需要提交并推送到 `https://github.com/1412955950/Brevo-login-demo.git`。
- 额外要求：排除不应进入仓库的文件，并展示项目目录结构。
- 因此在项目初始化阶段加入了：
  - `.gitignore`
  - 远端仓库绑定
  - `docs/progress-log.md`

### 5. 实现过程中的关键调整
- 为降低安装风险，SQLite 改用 Node.js 内置 `node:sqlite`，不再依赖额外原生编译包。
- 在当前执行环境中，默认端口 `3000` 无法监听，因此将默认本地端口调整为 `45678`。
- 为了让自动化脚本无需手动查看邮箱，增加了仅开发环境可用的 `/api/dev/latest-otp` 调试接口，并使用 `X-Dev-Token` 保护。

### 6. 自动化验证
- 安装依赖成功，生成 `package-lock.json`。
- `npm run build` 通过。
- 后端健康检查通过。
- 通过本地 Brevo 配置完成真实 OTP 发信。
- 自动化脚本完整通过以下流程：
  1. 请求发送 OTP
  2. 读取开发调试接口中的最新 OTP
  3. 验证错误 OTP 会被拒绝
  4. 使用正确 OTP 登录
  5. 检查会话状态为已登录
  6. 退出登录
  7. 再次检查会话状态为未登录

### 7. 已实现结果
- 后端已支持：
  - 请求 OTP
  - 通过 Brevo 发送真实邮件
  - OTP 登录
  - 会话保持
  - 登录状态查询
  - 退出登录
- 前端已支持：
  - 输入邮箱
  - 请求 OTP
  - 输入 OTP 登录
  - 展示当前登录状态
  - 退出登录
- 测试脚本已支持完整链路自动化验证。

### 8. 开发期问题排查与修复
- 在联调过程中发现前端 Vite 代理曾固定指向 `45678`，而本地 `.env` 实际使用的是 `45679`，导致前端请求 OTP 时出现 `ECONNREFUSED`。
- 后续将 `vite.config.js` 改为自动读取 `.env` 中的 `HOST` 与 `PORT`，消除了前后端端口不一致的问题。
- 测试脚本也同步改为默认跟随 `.env` 中的后端地址，避免脚本和页面命中不同端口。
- 在 Windows 开发环境下发现 `node --watch` 会因为 SQLite 数据文件写入而触发服务重启，导致测试脚本请求 OTP 时出现 `ECONNRESET`。
- 最终将后端开发监听范围限制为 `server/src` 和 `.env`，解决了数据库写入导致的误重启问题。
- 后端补充了更清晰的 `EADDRINUSE` 和 `EACCES` 提示，以及优雅退出逻辑，方便开发者定位端口冲突。

### 9. 仓库同步与资料保留
- 早期推送在 WSL 侧因为缺少 GitHub HTTPS 凭据失败。
- 最终改用 Windows 侧 Git 凭据完成 `main` 分支推送。
- 仓库继续忽略 `.env`、数据库文件、`API key.txt` 等本地敏感文件。
- 根据后续要求，将 `brevo.md` 一并纳入仓库，作为对照 Brevo 请求格式的本地参考资料。

## 本次实现中的默认约定
- 使用单仓库、单 `package.json`
- 默认本地后端地址为 `http://127.0.0.1:45678`
- 默认只接入 `Brevo`
- `.env`、数据库文件、依赖目录、API Key 文件都不会进入仓库
