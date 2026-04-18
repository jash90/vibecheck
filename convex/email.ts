import { v } from 'convex/values';

import { internalAction } from './_generated/server';

export const sendParentApproval = internalAction({
  args: {
    parentEmail: v.string(),
    childName: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, { parentEmail, childName, token }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY not set — skipping parent approval email', {
        parentEmail,
        token,
      });
      return { sent: false as const };
    }

    const approveUrl =
      `${process.env.CONVEX_SITE_URL ?? ''}/parent-approval?token=${encodeURIComponent(token)}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VibeCheck <noreply@vibecheck.app>',
        to: [parentEmail],
        subject: `${childName} prosi o Twoją zgodę — VibeCheck`,
        html: `
          <div style="font-family:system-ui,sans-serif;line-height:1.5;max-width:480px">
            <h2>Potrzebujemy Twojej zgody</h2>
            <p>${childName} chce korzystać z aplikacji VibeCheck — aplikacji pomagającej nastolatkom budować zdrowe nawyki.</p>
            <p>Aby zaakceptować, kliknij poniższy przycisk. Link wygasa za 7 dni.</p>
            <p><a href="${approveUrl}" style="background:#8b5cf6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Zatwierdzam</a></p>
            <p style="color:#64748b;font-size:14px">Jeśli to nie Ty, zignoruj tę wiadomość.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend API failed: ${res.status} ${text}`);
    }

    return { sent: true as const };
  },
});
