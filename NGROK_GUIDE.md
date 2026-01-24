# Ngrok Quick Start Guide ??

## Setup (Gör en gång)

1. **Skapa Ngrok-konto:** https://dashboard.ngrok.com/signup
2. **Kopiera authtoken** från dashboard
3. **Konfigurera:**
   ```bash
   ngrok config add-authtoken <DIN_TOKEN>
   ```

## Daglig användning

### Starta Backend + Ngrok

**Terminal 1 - Backend:**
```bash
cd Node_Android_project
npm start
```

**Terminal 2 - Ngrok:**
```bash
ngrok http 3000
```

**Kopiera URL:** `https://abc123.ngrok-free.app`

### Uppdatera Frontend

1. **Öppna:** `docs/js/config.js`

2. **Ändra:**
```javascript
NGROK_API: 'https://abc123.ngrok-free.app', // DIN URL!
MODE: 'ngrok'
```

3. **Push:**
```bash
git add docs/js/config.js
git commit -m "Update ngrok URL"
git push
```

4. **Vänta 1-2 min** ? https://featuredev.github.io/Node_Android_project/index/index.html

## Termux (Telefon)

**Session 1 - Backend:**
```bash
cd Node_Android_project
npm start
```

**Session 2 - Ngrok:**
Svajpa från vänster ? New session
```bash
ngrok http 3000
```

## Tips

- Ngrok URL ändras vid varje omstart (gratis tier)
- Session timeout efter ~8h inaktivitet
- Betald plan ($8/månad) ? statisk URL
- 40 requests/minut på gratis tier

## Troubleshooting

**Problem:** "ERR_NGROK_108"
- **Lösning:** Kolla att authtoken är korrekt konfigurerat

**Problem:** "tunnel session expired"
- **Lösning:** Starta om ngrok, uppdatera URL i config.js

**Problem:** 429 Too Many Requests
- **Lösning:** Gratis tier limit nådd, vänta 1 minut eller uppgradera

**Problem:** GitHub Pages visar gammal version
- **Lösning:** Hard refresh (Ctrl+Shift+R) eller vänta 2-3 min
