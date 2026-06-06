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

const RESEND_API_URL = 'https://api.resend.com/emails';

function getMailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'onboarding@resend.dev';
  const replyTo = process.env.MAIL_REPLY_TO || from;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  return { apiKey, from, replyTo, appUrl };
}

export function isMailConfigured(): boolean {
  return Boolean(getMailConfig().apiKey);
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const { apiKey, from } = getMailConfig();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Resend request failed with ${response.status}: ${errorBody || response.statusText}`);
  }
}

export async function sendUserInvitationEmail(input: InviteEmailInput): Promise<void> {
  const { replyTo, appUrl } = getMailConfig();
  const roleLabel = input.invitedRole.replace(/_/g, ' ').toLowerCase();
  const inviter = input.invitedByName?.trim() || 'EDUsphere';
  const workspaceLine = input.workspaceName ? `Workspace: ${input.workspaceName}` : 'Platform-level invitation';
  const signinUrl = `${appUrl.replace(/\/$/, '')}/signin`;

  const subject = `You have been invited to EDUsphere as ${roleLabel}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;">
      <h2 style="margin-bottom:16px;">You have been invited to EDUsphere</h2>
      <p>${inviter} invited you to join EDUsphere as <strong>${input.invitedRole}</strong>.</p>
      <p>${workspaceLine}</p>
      <p>Your temporary password is:</p>
      <div style="display:inline-block;padding:12px 16px;background:#f1f5f9;border-radius:8px;font-weight:700;letter-spacing:0.04em;">
        ${input.temporaryPassword}
      </div>
      <p style="margin-top:20px;">Sign in here: <a href="${signinUrl}">${signinUrl}</a></p>
      <p>After signing in, change your password immediately.</p>
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
