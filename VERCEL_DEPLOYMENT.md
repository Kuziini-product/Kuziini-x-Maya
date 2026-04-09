# Vercel Deployment - Kuziini x Maya

## Pași pentru deploy pe Vercel

### 1. Conectează cu Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Deploy inițial
```bash
cd C:\Users\madal\OneDrive\Desktop\APP\Kuziini_Maya
vercel
```

### 3. Răspunde la întrebări:
- **Scope**: Alege account-ul Kuziini
- **Project Name**: `kuziini-x-maya`
- **Framework Preset**: Selectează "Next.js"
- **Root directory**: `.` (current)
- **Build settings**: Default (npm run build)
- **Deploy**: Confirmă

### 4. Link GitHub pentru CI/CD (Opțional)
Vercel va detecta automat push-urile pe GitHub și va face deploy automat.

### 5. Variabile de mediu (Dacă integrezi cu API real)
```
POS_API_URL=https://pos.your-domain.com/api
PMS_API_URL=https://pms.your-domain.com/api
POS_API_KEY=your-key
PMS_API_KEY=your-key
```

### 6. Verifică deployment
```
vercel ls
vercel env pull
vercel deploy --prod
```

---
## Demo URLs disponibile după deploy:
- `/u/A-01` — Zona Sunrise (sesiune existentă)
- `/u/A-02` — Zona Sunrise (sesiune nouă)
- `/u/B-07` — Zona Sunset
- `/u/VIP-03` — Zona VIP Premium

## Status:
- ✅ Repository GitHub: https://github.com/Kuziini-product/Kuziini-x-Maya
- ⏳ Deploy Vercel: (În așteptare)
- ⏳ URL Production: (După deploy)
