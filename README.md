# Mogges Store - E-commerce Platform

En fullständig e-commerce webbshop med Node.js backend och statisk frontend.

## ?? Kör Backend på Telefon + Frontend på GitHub Pages

### **Backend (Telefon - Termux)**

1. **Installera Termux** på din Android-telefon
2. **Installera Node.js:**
   ```bash
   pkg update
   pkg install nodejs git
   ```

3. **Klona repot:**
   ```bash
   git clone https://github.com/FeatureDev/Node_Android_project
   cd Node_Android_project
   ```

4. **Installera dependencies:**
   ```bash
   npm install
   ```

5. **Initiera databas:**
   ```bash
   npm run init-db
   ```

6. **Hitta din telefons IP-adress:**
   - Gå till: Settings ? WiFi ? Din WiFi ? IP Address
   - Exempel: `192.168.1.100`

7. **Starta servern:**
   ```bash
   npm start
   ```
   
   Servern körs nu på: `http://192.168.1.100:3000`

### **Frontend (GitHub Pages)**

1. **Aktivera GitHub Pages:**
   - Gå till GitHub repo ? Settings ? Pages
   - Source: Deploy from a branch
   - Branch: `main` ? `/docs` folder
   - Save

2. **Uppdatera API URL:**
   - Öppna `docs/js/config.js`
   - Ändra `PHONE_API` till din telefons IP:
   ```javascript
   PHONE_API: 'http://192.168.1.100:3000', // DIN IP HÄR!
   ```
   - Sätt `USE_PHONE: true`

3. **Commit och push:**
   ```bash
   git add docs/js/config.js
   git commit -m "Update API URL to phone backend"
   git push
   ```

4. **Vänta 1-2 minuter** tills GitHub Pages deployas

5. **Öppna din site:**
   - URL: `https://featuredev.github.io/Node_Android_project/index/index.html`

### **Viktigt!**
- Både telefon och dator måste vara på **samma WiFi-nätverk**
- Backend (telefon) måste vara **igång** när du använder frontend
- CORS är aktiverat för att tillåta requests från GitHub Pages

---

## ?? Kör Lokalt (Development)

1. **Installera dependencies:**
   ```bash
   npm install
   ```

2. **Initiera databas:**
   ```bash
   npm run init-db
   ```

3. **Starta server:**
   ```bash
   npm start
   ```

4. **Öppna i browser:**
   ```
   http://localhost:3000
   ```

**Config.js är inställd på:**
```javascript
USE_PHONE: false // Använder localhost
```

---

## ?? Admin Login

**Standard Admin:**
- Email: `admin@moggesstore.se`
- Password: `admin123`

**Admin Panel:** `/login.html`

---

## ?? Projektstruktur

```
Node_android_project/
??? Server.js              # Express backend med API
??? init-db.js             # Databas setup
??? package.json
??? moggesstore.db         # SQLite databas
??? docs/                  # Frontend (GitHub Pages)
    ??? index/             # HTML sidor
    ?   ??? index.html
    ?   ??? products.html
    ?   ??? cart.html
    ?   ??? checkout.html
    ?   ??? about.html
    ?   ??? login.html
    ?   ??? admin.html
    ??? css/               # Stylesheets
    ??? js/                # JavaScript
    ?   ??? config.js      # API configuration
    ?   ??? products.js
    ?   ??? cart.js
    ?   ??? checkout.js
    ?   ??? login.js
    ?   ??? admin.js
    ??? picture/           # Bilder
```

---

## ?? Features

- ? **Produktkatalog** med kategorier
- ? **Varukorg** med localStorage
- ? **Checkout** med QR-kod betalning
- ? **Admin Panel** för produkthantering
- ? **Authentication** med bcrypt + sessions
- ? **REST API** för alla operationer
- ? **SQLite Databas**
- ? **Responsive Design**
- ? **CORS support** för cross-origin requests

---

## ?? Troubleshooting

**Problem: Produkter laddas inte**
- Kolla att backend är igång
- Verifiera att `config.js` har rätt IP-adress
- Kolla Console för error-meddelanden

**Problem: CORS errors**
- Backend måste ha CORS aktiverat (redan konfigurerat)
- Telefon och dator måste vara på samma nätverk

**Problem: 404 på GitHub Pages**
- Vänta 1-2 minuter efter push
- Kontrollera att Pages är aktiverat
- URL ska innehålla `/index/index.html`

---

## ?? License

ISC

## ????? Author

Mogges Store Development Team
