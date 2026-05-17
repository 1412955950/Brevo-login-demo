import {
  getSession,
  getSessionCookieClearOptions
} from "../services/session.js";

export function authSession(req, res, next) {
  const sessionId = req.cookies?.session_id;
  const session = getSession(sessionId);

  if (!session) {
    req.authSession = null;
    if (sessionId) {
      res.clearCookie("session_id", getSessionCookieClearOptions());
    }
    return next();
  }

  req.authSession = {
    sessionId: session.session_id,
    email: session.email,
    expiresAt: session.expires_at
  };

  return next();
}
