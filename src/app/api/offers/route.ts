import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { sendPushToAll } from "@/lib/push";

const ADMIN_PASSWORD = "Kuziini1";

export interface OfferRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  photoUrl: string;       // kept for legacy offers
  photoIndex?: number;    // legacy single index
  photoIndexes?: number[]; // multiple selected photos
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
    const { name, phone, email, message, photoIndexes } = body as {
      name: string;
      phone: string;
      email: string;
      message: string;
      photoIndexes?: number[];
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
      photoUrl: "",
      photoIndexes: photoIndexes && photoIndexes.length > 0 ? photoIndexes : undefined,
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

    // Push notification
    sendPushToAll(
      "Cerere ofertă nouă",
      `${name} (${phone}) a solicitat o ofertă`,
      "offer"
    ).catch(() => {});

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
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log("[Offers] RESEND_API_KEY not set, skipping email");
    return;
  }

  const toEmail = process.env.NOTIFY_EMAIL || "madalintomescu@gmail.com";

  const indexes = offer.photoIndexes || (offer.photoIndex !== undefined ? [offer.photoIndex] : []);
  const photoLine = indexes.length > 0
    ? `<p style="color:#C9AB81;font-weight:bold;">📷 ${indexes.length === 1 ? "Foto" : "Foto selectate"}: ${indexes.map((i) => `#${i + 1}`).join(", ")} din galeria Kuziini</p>`
    : "";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kuziini App <onboarding@resend.dev>",
      to: toEmail,
      subject: `Solicitare oferta - ${offer.name}`,
      html: `
        <h2>Solicitare noua de oferta</h2>
        ${photoLine}
        <p><strong>Nume:</strong> ${offer.name}</p>
        <p><strong>Telefon:</strong> ${offer.phone}</p>
        <p><strong>Email:</strong> ${offer.email}</p>
        ${offer.message ? `<p><strong>Mesaj:</strong> ${offer.message}</p>` : ""}
        <hr/>
        <p style="color:#999;font-size:12px;">Trimis din aplicatia Kuziini × Maya — vezi foto in panoul admin</p>
      `,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error("[Offers] Resend API error:", JSON.stringify(result));
  } else {
    console.log("[Offers] Email sent successfully to", toEmail, "id:", result.id);
  }
}

