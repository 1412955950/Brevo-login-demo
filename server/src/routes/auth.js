import { Router } from "express";
import { config } from "../config.js";
import { sendOtpEmail } from "../services/brevo.js";
import {
  consumeOtp,
  discardOtp,
  getLatestDevOtp,
  issueOtp
} from "../services/otp.js";
import {
  createSession,
  deleteSession,
  getSessionCookieClearOptions,
  getSessionCookieOptions
} from "../services/session.js";

const router = Router();

function createError(statusCode, message, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
}

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.post(
  "/auth/request-otp",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!validateEmail(email)) {
      throw createError(400, "请输入有效的邮箱地址", {
        code: "INVALID_EMAIL"
      });
    }

    const issued = issueOtp(email);

    try {
      const brevoResponse = await sendOtpEmail(issued);
      return res.json({
        ok: true,
        cooldownSeconds: issued.cooldownSeconds,
        messageId: brevoResponse.messageId
      });
    } catch (error) {
      discardOtp(issued.id, issued.email);
      throw error;
    }
  })
);

router.post("/auth/login", (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();

    if (!validateEmail(email)) {
      throw createError(400, "请输入有效的邮箱地址", {
        code: "INVALID_EMAIL"
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      throw createError(400, "请输入 6 位数字验证码", {
        code: "INVALID_OTP_FORMAT"
      });
    }

    const verified = consumeOtp(email, otp);
    const session = createSession(verified.email);

    res.cookie("session_id", session.sessionId, getSessionCookieOptions());
    return res.json({
      ok: true,
      email: verified.email
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/session", (req, res) => {
  if (!req.authSession) {
    return res.json({
      authenticated: false
    });
  }

  return res.json({
    authenticated: true,
    email: req.authSession.email
  });
});

router.post("/auth/logout", (req, res) => {
  if (req.authSession?.sessionId) {
    deleteSession(req.authSession.sessionId);
  }

  res.clearCookie("session_id", getSessionCookieClearOptions());
  return res.json({
    ok: true
  });
});

router.get("/dev/latest-otp", (req, res, next) => {
  try {
    if (!config.isDev) {
      throw createError(404, "开发调试接口仅在开发环境可用", {
        code: "DEV_ENDPOINT_DISABLED"
      });
    }

    const devToken = req.get("X-Dev-Token");
    if (!devToken || devToken !== config.devApiToken) {
      throw createError(403, "调试访问令牌无效", {
        code: "INVALID_DEV_TOKEN"
      });
    }

    const email = normalizeEmail(req.query.email);
    if (!validateEmail(email)) {
      throw createError(400, "请输入有效的邮箱地址", {
        code: "INVALID_EMAIL"
      });
    }

    return res.json(getLatestDevOtp(email));
  } catch (error) {
    return next(error);
  }
});

export default router;
