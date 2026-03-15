import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

const ADMIN_PASSWORD = "Kuziini1";

export interface OfferRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  photoUrl: string;
  timestamp: string;
  read: boolean;
}

async function getOffers(): Promise<OfferRequest[]> {
  return kvGet<OfferRequest[]>("offers:kuziini", []);
}

async function saveOffers(offers: OfferRequest[]) {
  await kvSet("offers:kuziini", offers);
}

// POST - submit new offer request (public) or admin actions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };

  // Public action: submit offer request
  if (action === "submit") {
    const { name, phone, email, message, photoUrl } = body as {
      name: string;
      phone: string;
      email: string;
      message: string;
      photoUrl: string;
    };

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Completează numele, telefonul și emailul." },
        { status: 400 }
      );
    }

    const offers = await getOffers();
    const newOffer: OfferRequest = {
      id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: (message || "").trim(),
      photoUrl: photoUrl || "",
      timestamp: new Date().toISOString(),
      read: false,
    };

    offers.unshift(newOffer);
    await saveOffers(offers);

    // Try to send email notification
    try {
      await sendEmailNotification(newOffer);
    } catch {
      // Email is best-effort, don't fail the request
      console.error("[Offers] Failed to send email notification");
    }

    return NextResponse.json({ success: true });
  }

  // Admin actions require password
  const { password } = body as { password: string };
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: "Parola incorecta." },
      { status: 401 }
    );
  }

  const offers = await getOffers();

  switch (action) {
    case "list":
      return NextResponse.json({ success: true, data: offers });

    case "markRead": {
      const { offerId } = body as { offerId: string };
      const offer = offers.find((o) => o.id === offerId);
      if (offer) {
        offer.read = true;
        await saveOffers(offers);
      }
      return NextResponse.json({ success: true, data: offers });
    }

    case "delete": {
      const { offerId: delId } = body as { offerId: string };
      const filtered = offers.filter((o) => o.id !== delId);
      await saveOffers(filtered);
      return NextResponse.json({ success: true, data: filtered });
    }

    default:
      return NextResponse.json(
        { success: false, error: "Actiune invalida." },
        { status: 400 }
      );
  }
}

async function sendEmailNotification(offer: OfferRequest) {
  // Use Resend if configured, otherwise skip
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log("[Offers] RESEND_API_KEY not set, skipping email");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kuziini App <onboarding@resend.dev>",
      to: "my@kuziini.ro",
      subject: `Solicitare oferta - ${offer.name}`,
      html: `
        <h2>Solicitare noua de oferta</h2>
        <p><strong>Nume:</strong> ${offer.name}</p>
        <p><strong>Telefon:</strong> ${offer.phone}</p>
        <p><strong>Email:</strong> ${offer.email}</p>
        ${offer.message ? `<p><strong>Mesaj:</strong> ${offer.message}</p>` : ""}
        ${offer.photoUrl ? `<p><strong>Produs:</strong><br/><img src="${offer.photoUrl}" style="max-width:400px;border-radius:8px;" /></p>` : ""}
        <hr/>
        <p style="color:#999;font-size:12px;">Trimis din aplicatia Kuziini × LOFT</p>
      `,
    }),
  });
}
