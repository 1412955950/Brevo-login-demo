import { useEffect, useState } from "react";

const initialSession = {
  authenticated: false,
  email: ""
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(data.error ?? "请求失败");
    error.code = data.code;
    error.remainingSeconds = data.remainingSeconds;
    throw error;
  }

  return data;
}

export default function App() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState(initialSession);
  const [checkingSession, setCheckingSession] = useState(true);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState({
    type: "idle",
    text: "输入邮箱后即可请求验证码。"
  });

  async function refreshSession() {
    const data = await requestJson("/api/auth/session", {
      method: "GET",
      headers: {}
    });
    setSession({
      authenticated: data.authenticated,
      email: data.email ?? ""
    });
    return data;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const data = await requestJson("/api/auth/session", {
          method: "GET",
          headers: {}
        });

        if (!cancelled) {
          setSession({
            authenticated: data.authenticated,
            email: data.email ?? ""
          });
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({
            type: "error",
            text: error.message
          });
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRequestOtp(event) {
    event.preventDefault();
    setRequestingOtp(true);
    setNotice({
      type: "loading",
      text: "正在向 Brevo 请求发送验证码..."
    });

    try {
      const data = await requestJson("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      setNotice({
        type: "success",
        text: `验证码已发送，请检查邮箱。冷却时间 ${data.cooldownSeconds} 秒。`
      });
    } catch (error) {
      const cooldownText =
        error.remainingSeconds != null
          ? `，请在 ${error.remainingSeconds} 秒后重试。`
          : "";

      setNotice({
        type: "error",
        text: `${error.message}${cooldownText}`
      });
    } finally {
      setRequestingOtp(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoggingIn(true);
    setNotice({
      type: "loading",
      text: "正在校验验证码并登录..."
    });

    try {
      const data = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      });

      setSession({
        authenticated: true,
        email: data.email
      });
      setOtp("");
      setNotice({
        type: "success",
        text: `登录成功，当前邮箱：${data.email}`
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message
      });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setNotice({
      type: "loading",
      text: "正在退出登录..."
    });

    try {
      await requestJson("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({})
      });
      await refreshSession();
      setOtp("");
      setNotice({
        type: "success",
        text: "已退出登录。"
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Brevo + Email OTP</p>
        <h1>本地可运行的邮箱验证码登录 Demo</h1>
        <p className="hero-copy">
          这个页面会请求后端发送真实 OTP 邮件，通过邮箱验证码登录，维持会话状态，并支持退出。
        </p>
      </section>

      <section className="workbench">
        <article className="card status-card">
          <div className="card-header">
            <h2>当前状态</h2>
            <span
              className={
                session.authenticated ? "pill pill-online" : "pill pill-offline"
              }
            >
              {checkingSession
                ? "检查中"
                : session.authenticated
                  ? "已登录"
                  : "未登录"}
            </span>
          </div>
          <p className="status-copy">
            {checkingSession
              ? "正在恢复本地会话..."
              : session.authenticated
                ? `当前登录邮箱：${session.email}`
                : "当前没有有效会话，先请求验证码再登录。"}
          </p>
          <div className={`notice notice-${notice.type}`}>{notice.text}</div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>请求验证码</h2>
          </div>
          <form className="stack" onSubmit={handleRequestOtp}>
            <label className="field">
              <span>邮箱地址</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={requestingOtp}>
              {requestingOtp ? "发送中..." : "发送 OTP"}
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>登录与退出</h2>
          </div>
          <form className="stack" onSubmit={handleLogin}>
            <label className="field">
              <span>收到的 OTP</span>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="6 位验证码"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={loggingIn}>
              {loggingIn ? "登录中..." : "使用 OTP 登录"}
            </button>
          </form>

          <button
            type="button"
            className="ghost-button"
            onClick={handleLogout}
            disabled={!session.authenticated || loggingOut}
          >
            {loggingOut ? "退出中..." : "退出登录"}
          </button>
        </article>
      </section>
    </main>
  );
}
