import axios from "axios";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:45678";
const testEmail = process.env.TEST_EMAIL;
const devApiToken = process.env.DEV_API_TOKEN;

if (!testEmail) {
  console.error("缺少 TEST_EMAIL 环境变量。");
  process.exit(1);
}

if (!devApiToken) {
  console.error("缺少 DEV_API_TOKEN 环境变量。");
  process.exit(1);
}

const cookies = new Map();

function updateCookieJar(setCookieHeaders = []) {
  for (const header of setCookieHeaders) {
    const [pair] = header.split(";", 1);
    const [name, value] = pair.split("=");

    if (!value) {
      cookies.delete(name);
      continue;
    }

    cookies.set(name.trim(), value.trim());
  }
}

function getCookieHeader() {
  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function apiRequest(method, pathname, options = {}) {
  const response = await axios({
    method,
    url: new URL(pathname, baseUrl).toString(),
    data: options.data,
    headers: {
      ...(options.headers ?? {}),
      ...(getCookieHeader() ? { Cookie: getCookieHeader() } : {})
    },
    validateStatus: () => true
  });

  updateCookieJar(response.headers["set-cookie"] ?? []);
  return response;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("1. 请求发送 OTP...");
  const requestOtp = await apiRequest("post", "/api/auth/request-otp", {
    data: { email: testEmail }
  });
  assert(requestOtp.status === 200, `发送 OTP 失败：${JSON.stringify(requestOtp.data)}`);
  console.log("   已成功请求发送 OTP。");

  console.log("2. 读取开发调试接口中的最新 OTP...");
  const latestOtp = await apiRequest("get", `/api/dev/latest-otp?email=${encodeURIComponent(testEmail)}`, {
    headers: {
      "X-Dev-Token": devApiToken
    }
  });
  assert(latestOtp.status === 200, `获取 OTP 失败：${JSON.stringify(latestOtp.data)}`);
  const otp = latestOtp.data.otp;
  assert(/^\d{6}$/.test(otp), "读取到的 OTP 格式不正确。");
  console.log("   已成功获取 OTP。");

  console.log("3. 先验证错误 OTP 会被拒绝...");
  const wrongOtpLogin = await apiRequest("post", "/api/auth/login", {
    data: {
      email: testEmail,
      otp: "000000"
    }
  });
  assert(wrongOtpLogin.status === 401, "错误 OTP 没有被正确拒绝。");
  console.log("   错误 OTP 已被正确拒绝。");

  console.log("4. 使用正确 OTP 登录...");
  const login = await apiRequest("post", "/api/auth/login", {
    data: {
      email: testEmail,
      otp
    }
  });
  assert(login.status === 200, `登录失败：${JSON.stringify(login.data)}`);
  assert(cookies.has("session_id"), "登录成功后没有收到 session_id Cookie。");
  console.log("   登录成功。");

  console.log("5. 检查当前会话状态...");
  const session = await apiRequest("get", "/api/auth/session");
  assert(session.status === 200, `检查登录状态失败：${JSON.stringify(session.data)}`);
  assert(session.data.authenticated === true, "登录状态没有变成已登录。");
  assert(session.data.email === testEmail.toLowerCase(), "返回的登录邮箱不正确。");
  console.log("   会话状态正确。");

  console.log("6. 执行退出登录...");
  const logout = await apiRequest("post", "/api/auth/logout", {
    data: {}
  });
  assert(logout.status === 200, `退出登录失败：${JSON.stringify(logout.data)}`);
  console.log("   已退出登录。");

  console.log("7. 再次检查会话状态...");
  const afterLogoutSession = await apiRequest("get", "/api/auth/session");
  assert(
    afterLogoutSession.status === 200,
    `退出后的状态检查失败：${JSON.stringify(afterLogoutSession.data)}`
  );
  assert(afterLogoutSession.data.authenticated === false, "退出后仍显示为已登录。");
  console.log("   退出后的状态正确。");

  console.log("测试通过：完整登录链路验证成功。");
}

main().catch((error) => {
  console.error(`测试失败：${error.message}`);
  process.exit(1);
});
