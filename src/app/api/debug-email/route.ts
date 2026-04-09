import { NextResponse } from "next/server";

export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  const info = {
    RESEND_API_KEY_set: !!resendKey,
    RESEND_API_KEY_length: resendKey ? resendKey.length : 0,
    RESEND_API_KEY_prefix: resendKey ? resendKey.slice(0, 6) + "..." : "NOT SET",
    NOTIFY_EMAIL: notifyEmail || "NOT SET (will default to my@kuziini.ro)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // If key is set, try sending a test email
  if (resendKey) {
    const toEmail = notifyEmail || "my@kuziini.ro";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kuziini App <onboarding@resend.dev>",
          to: toEmail,
          subject: "Test email - Kuziini debug",
          html: "<h2>Test reusit!</h2><p>Daca primesti acest email, notificarile functioneaza corect.</p>",
        }),
      });

      const result = await res.json();
      return NextResponse.json({
        ...info,
        emailTest: {
          status: res.status,
          ok: res.ok,
          sentTo: toEmail,
          response: result,
        },
      });
    } catch (err) {
      return NextResponse.json({
        ...info,
        emailTest: {
          error: String(err),
          sentTo: toEmail,
        },
      });
    }
  }

  return NextResponse.json(info);
}

