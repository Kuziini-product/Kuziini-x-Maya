# 🏖️ Zini × Liota Beach Club — Aplicație Comenzi

MVP complet Next.js 14 pentru comenzi de plajă prin QR code.

---

## 🚀 Instalare și rulare

### Cerințe
- Node.js 18+
- npm sau yarn

### Pași

```bash
# 1. Instalează dependențele
npm install

# 2. Pornește serverul de dezvoltare
npm run dev

# 3. Deschide în browser
# http://localhost:3000
# Redirecționează automat la /u/A-01 (umbrelă demo)
```

---

## 📱 Testare QR

Pentru demo, umbrele disponibile:
- `/u/A-01` — Zona Sunrise (are sesiune existentă)
- `/u/A-02` — Zona Sunrise (sesiune nouă)
- `/u/B-07` — Zona Sunset
- `/u/VIP-03` — Zona VIP Premium

**Scenarii de test:**
1. Deschide `/u/A-02` → ești primul → devii **owner**
2. Deschide `/u/A-02` cu alt telefon → ești **guest**
3. Ca guest, poți comanda separat sau cere aprobare owner
4. Testează Room Charge: telefon `+40700000001` are credit activ

---

## 🗂️ Structura proiectului

```
src/
├── app/
│   ├── api/                    # Mock API routes
│   │   ├── umbrella/[id]/      # GET - info umbrelă
│   │   ├── menu/               # GET - meniu
│   │   ├── orders/             # GET - comenzi
│   │   ├── order/              # POST - plasare comandă
│   │   ├── owner/approve/      # POST - aprobare guest
│   │   ├── owner/reject/       # POST - respingere guest
│   │   ├── bill/request/       # POST - solicitare notă
│   │   ├── bill/close/         # POST - închidere notă
│   │   ├── bill/charge-room/   # POST - room charge
│   │   ├── payment-options/    # GET - opțiuni plată
│   │   └── session/register/   # POST - înregistrare sesiune
│   └── u/[umbrellaId]/
│       ├── page.tsx            # Landing page
│       ├── menu/page.tsx       # Meniu dinamic
│       ├── cart/page.tsx       # Coș + plasare comandă
│       ├── orders/page.tsx     # Statusuri comenzi
│       ├── bill/page.tsx       # Notă + plată
│       └── owner-requests/     # Aprobare cereri guest
├── components/
│   ├── ui/                     # Componente reutilizabile
│   ├── layout/                 # Nav, Providers, PhoneModal
│   └── menu/                   # MenuItemCard
├── lib/
│   ├── mock-data.ts            # Date mock (meniu, umbrele etc.)
│   └── utils.ts                # Helpers
├── store/
│   └── index.ts                # Zustand (cart + session)
└── types/
    └── index.ts                # TypeScript types
```

---

## 🔌 Integrare cu POS/PMS real

### Înlocuiește mock-urile cu apeluri reale:

| Mock | Endpoint real |
|------|---------------|
| `GET /api/umbrella/[id]` | PMS: verifică umbrela și sesiunea |
| `GET /api/menu` | POS: GET produse active |
| `POST /api/order` | POS: POST comandă nouă |
| `GET /api/orders` | POS: GET comenzi per sesiune |
| `POST /api/bill/charge-room` | PMS: POST room charge |
| `GET /api/payment-options` | PMS: GET credit guest |

### Variabile de mediu (`.env.local`)

```env
POS_API_URL=https://pos.hotelul-tau.ro/api
PMS_API_URL=https://pms.hotelul-tau.ro/api
POS_API_KEY=your-api-key
PMS_API_KEY=your-api-key
```

### Autentificare reală
- Înlocuiește `PhoneModal` cu verificare OTP (ex: Twilio)
- Sau conectează-te la sistemul de check-in al hotelului

---

## 🎨 Design
- **Fonturi:** Playfair Display (titluri) + DM Sans (body)
- **Culori:** Ocean (albastru), Sand (auriu), Coral (accent)
- **Mobile-first:** testat pe 375px+
- **Animații:** CSS + Framer Motion ready

---

## 📋 Logică business

- **Owner:** primul telefon înregistrat pe umbrela → control total
- **Guest:** telefon diferit → comandă separată sau cerere aprobare
- **Room Charge:** verificat prin API vs limită credit disponibilă
- **Comenzi:** polling la 15s pentru statusuri live
- **Coș:** persistent în localStorage via Zustand

---

Built with ❤️ pentru Zini × Liota Beach Club
