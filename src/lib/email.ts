import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Remiovas";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM = `${APP_NAME} <${process.env.GMAIL_USER}>`;

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;min-height:100vh;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#0070f3;letter-spacing:-0.5px;">${APP_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#4b5563;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} ${APP_NAME}. Built on Stellar.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const { to, name, token } = params;
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Verify your ${APP_NAME} account`,
    html: baseTemplate(`
      <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 8px;">Verify your email</h1>
      <p style="color:#94a3b8;font-size:16px;margin:0 0 32px;">Hi ${name}, welcome to ${APP_NAME}!</p>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 32px;">
        Click the button below to verify your email address and activate your wallet. This link expires in 24 hours.
      </p>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#0070f3;color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">
          Verify Email Address
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;word-break:break-all;">
        Or copy this link: ${verifyUrl}
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const { to, name, token } = params;
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: baseTemplate(`
      <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 8px;">Reset your password</h1>
      <p style="color:#94a3b8;font-size:16px;margin:0 0 32px;">Hi ${name},</p>
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 32px;">
        We received a request to reset your password. Click below to set a new one. This link expires in 1 hour.
      </p>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#0070f3;color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">
          Reset Password
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;">
        If you did not request this, you can safely ignore this email.
      </p>
    `),
  });
}

export async function sendPaymentReceivedEmail(params: {
  to: string;
  name: string;
  amount: string;
  from: string;
  memo?: string;
  txHash: string;
}): Promise<void> {
  const { to, name, amount, from, memo, txHash } = params;
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You received $${amount} USDC on ${APP_NAME}`,
    html: baseTemplate(`
      <h1 style="color:#10b981;font-size:24px;font-weight:700;margin:0 0 8px;">Payment Received!</h1>
      <p style="color:#94a3b8;font-size:16px;margin:0 0 32px;">Hi ${name},</p>
      <div style="background:#1f2937;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">AMOUNT RECEIVED</p>
        <p style="color:#10b981;font-size:36px;font-weight:800;margin:0;">$${amount} <span style="font-size:18px;">USDC</span></p>
      </div>
      <table width="100%" style="margin:0 0 24px;">
        <tr>
          <td style="color:#64748b;font-size:13px;padding:8px 0;">From</td>
          <td style="color:#cbd5e1;font-size:13px;text-align:right;word-break:break-all;">${from}</td>
        </tr>
        ${memo ? `<tr><td style="color:#64748b;font-size:13px;padding:8px 0;">Memo</td><td style="color:#cbd5e1;font-size:13px;text-align:right;">${memo}</td></tr>` : ""}
      </table>
      <div style="text-align:center;">
        <a href="${explorerUrl}" style="display:inline-block;padding:12px 24px;background:transparent;color:#0070f3;text-decoration:none;border:1px solid #0070f3;border-radius:12px;font-weight:600;font-size:14px;">
          View on Stellar Explorer
        </a>
      </div>
    `),
  });
}
