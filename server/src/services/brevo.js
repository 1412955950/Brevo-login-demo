import axios from "axios";
import { config, missingBrevoConfig } from "../config.js";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOtpEmail({ email, otp, expiresAt }) {
  const missing = missingBrevoConfig();
  if (missing.length > 0) {
    const error = new Error(
      `Brevo 配置不完整，缺少：${missing.join(", ")}`
    );
    error.statusCode = 500;
    error.code = "BREVO_CONFIG_MISSING";
    throw error;
  }

  const expiresInMinutes = Math.max(
    1,
    Math.round((expiresAt - Date.now()) / (60 * 1000))
  );

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: config.brevoSenderName,
        email: config.brevoSenderEmail
      },
      to: [
        {
          email
        }
      ],
      subject: "Your login code",
      htmlContent: `
        <html>
          <head></head>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #1f1f1f;">
            <h2 style="margin-top: 0;">Your login code</h2>
            <p>Use the following OTP to complete your sign-in:</p>
            <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em;">
              ${escapeHtml(otp)}
            </p>
            <p>This code will expire in approximately ${expiresInMinutes} minute(s).</p>
          </body>
        </html>
      `
    },
    {
      headers: {
        accept: "application/json",
        "api-key": config.brevoApiKey,
        "content-type": "application/json"
      },
      timeout: 15000
    }
  );

  return response.data;
}
