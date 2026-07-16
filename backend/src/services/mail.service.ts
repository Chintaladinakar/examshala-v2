import nodemailer from 'nodemailer';

type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

type InviteEmailInput = {
  to: string;
  invitedRole: string;
  invitedByName?: string | null;
  workspaceName?: string | null;
  temporaryPassword: string;
};

let transporter: nodemailer.Transporter | null = null;

function getMailConfig() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const from = process.env.MAIL_FROM || gmailUser || 'noreply@examshala.com';
  const replyTo = process.env.MAIL_REPLY_TO || from;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  return { gmailUser, gmailPassword, from, replyTo, appUrl };
}

function getTransporter() {
  if (transporter) return transporter;

  const { gmailUser, gmailPassword } = getMailConfig();

  if (!gmailUser || !gmailPassword) {
    throw new Error('Gmail credentials (GMAIL_USER and GMAIL_APP_PASSWORD) are not configured');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  return transporter;
}

export function isMailConfigured(): boolean {
  const { gmailUser, gmailPassword } = getMailConfig();
  return Boolean(gmailUser && gmailPassword);
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const { from } = getMailConfig();
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'EDUsphere',
      'List-Unsubscribe': '<mailto:support@examshala.com?subject=unsubscribe>',
    },
  });
}

export async function sendOTPEmail(email: string, otp: string, purpose: 'SIGNUP' | 'PASSWORD_RESET'): Promise<void> {
  const purposeText = purpose === 'SIGNUP' ? 'verify your email' : 'reset your password';
  const purposeTitle = purpose === 'SIGNUP' ? 'Verify Your Email' : 'Reset Your Password';

  const subject = `Your EDUsphere OTP - ${purpose === 'SIGNUP' ? 'Email Verification' : 'Password Reset'}`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1a202c;max-width:640px;margin:0 auto;background:#ffffff;padding:0;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">EDUsphere</h1>
        <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Security Verification</p>
      </div>

      <!-- Content -->
      <div style="padding:32px 24px;">
        <p style="margin:0 0 24px 0;font-size:16px;">Hello,</p>

        <p style="margin:0 0 24px 0;font-size:15px;">
          We received a request to ${purposeText} on your EDUsphere account. Use the code below to proceed:
        </p>

        <!-- OTP Box -->
        <div style="background:linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);border-radius:8px;padding:24px;margin:32px 0;text-align:center;">
          <p style="margin:0 0 12px 0;font-size:12px;color:#666;text-transform:uppercase;font-weight:600;letter-spacing:1px;">One-Time Password</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:4px;color:#0f766e;font-family:monospace;margin:0;">
            ${otp}
          </div>
          <p style="margin:12px 0 0 0;font-size:12px;color:#999;">This code expires in 5 minutes</p>
        </div>

        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:24px 0;border-radius:4px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            <strong>Security Note:</strong> Never share this code with anyone. EDUsphere support will never ask for your OTP.
          </p>
        </div>

        <p style="margin:24px 0 0 0;font-size:13px;color:#666;line-height:1.8;">
          Didn't request this code? If this wasn't you, please secure your account immediately by resetting your password.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:24px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#999;">
          This is an automated message from EDUsphere. Please do not reply to this email.
        </p>
        <p style="margin:0;font-size:11px;color:#bbb;">
          © 2026 EDUsphere. All rights reserved.
        </p>
      </div>
    </div>
  `;
  const text = [
    'EDUsphere Security Verification',
    `Your One-Time Password: ${otp}`,
    'This code expires in 5 minutes',
    '',
    `Use this code to ${purposeText}.`,
    '',
    'Security Note: Never share this code with anyone.',
    'If you did not request this, please secure your account by resetting your password.',
  ].join('\n');

  await sendMail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendUserInvitationEmail(input: InviteEmailInput): Promise<void> {
  const { replyTo, appUrl } = getMailConfig();
  const roleLabel = input.invitedRole.replace(/_/g, ' ').toLowerCase();
  const inviter = input.invitedByName?.trim() || 'EDUsphere';
  const workspaceLine = input.workspaceName ? `Workspace: ${input.workspaceName}` : 'Platform-level invitation';
  const signinUrl = `${appUrl.replace(/\/$/, '')}/signin`;

  const subject = `You have been invited to EDUsphere as ${roleLabel}`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1a202c;max-width:640px;margin:0 auto;background:#ffffff;padding:0;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">EDUsphere</h1>
        <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Platform Invitation</p>
      </div>

      <!-- Content -->
      <div style="padding:32px 24px;">
        <p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>

        <p style="margin:0 0 16px 0;font-size:15px;">
          <strong>${inviter}</strong> has invited you to join <strong>EDUsphere</strong> as a <strong style="color:#0f766e;">${roleLabel}</strong>.
        </p>

        <p style="margin:0 0 16px 0;font-size:14px;color:#666;">
          ${workspaceLine}
        </p>

        <!-- Credentials Box -->
        <div style="background:#f8fafc;border-left:4px solid #0f766e;padding:16px;margin:24px 0;border-radius:4px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#666;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Temporary Password</p>
          <p style="margin:0;font-size:16px;font-family:monospace;font-weight:600;letter-spacing:1px;color:#0f766e;">
            ${input.temporaryPassword}
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin:32px 0;">
          <a href="${signinUrl}" style="display:inline-block;padding:12px 32px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;transition:background 0.3s;">
            Sign In to EDUsphere
          </a>
        </div>

        <p style="margin:24px 0 0 0;font-size:13px;color:#666;line-height:1.8;">
          After signing in, <strong>change your password immediately</strong> to keep your account secure.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:24px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#999;">
          This is an automated message from EDUsphere. Please do not reply to this email.
        </p>
        <p style="margin:0;font-size:11px;color:#bbb;">
          © 2026 EDUsphere. All rights reserved.
        </p>
      </div>
    </div>
  `;
  const text = [
    'You have been invited to EDUsphere.',
    `${inviter} invited you as ${input.invitedRole}.`,
    workspaceLine,
    `Temporary password: ${input.temporaryPassword}`,
    `Sign in: ${signinUrl}`,
    'After signing in, change your password immediately.',
  ].join('\n');

  await sendMail({
    to: input.to,
    subject,
    html,
    text,
    replyTo,
  });
}
