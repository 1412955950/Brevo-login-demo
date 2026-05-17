# 项目进度记录

## 里程碑 1：初始化项目骨架
- 初始化 git 项目目录结构。
- 创建根目录 `package.json`，统一管理前后端依赖与脚本。
- 创建 `.gitignore`，排除密钥、数据库、依赖目录与本地工具目录。
- 完成 Vite 入口、React 页面骨架、Express 目录结构和基础文档文件。

## 里程碑 2：后端 OTP 与会话 API
- 实现 SQLite 数据表初始化：`otp_requests` 与 `sessions`。
- 实现 OTP 发送、验证码校验、会话保持、状态查询、退出登录。
- Brevo 发信严格使用 `brevo.md` 中的 `sender`、`to`、`subject`、`htmlContent` 格式。
- 增加开发环境调试接口 `/api/dev/latest-otp`，供自动化脚本读取最新 OTP。

## 里程碑 3：前端页面
- 完成 React 单页界面。
- 支持请求 OTP、输入 OTP 登录、展示当前登录状态和退出登录。
- 页面首次加载会自动恢复当前会话状态。

## 里程碑 4：测试脚本
- 完成 `scripts/test-login-flow.js`。
- 自动验证发码、获取开发 OTP、错误 OTP 拒绝、正确登录、状态检查、退出登录和退出后状态。
- 真实 Brevo 发信链路已完成一次完整验证并通过。

## 里程碑 5：文档
- 补齐 `README.md`、`.env.example` 和运行说明。
- 记录完整实现过程中的关键决策和验证结果。
