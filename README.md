# Mogges Store - E-commerce Platform

En fullständig e-commerce webbshop med Node.js backend och statisk frontend.

## ?? Deploy med Ngrok (Fungerar från vilket WiFi som helst!)

### **Backend (Telefon/Dator med Ngrok)**

#### **1. Installera Node.js och projektet**

**På Telefon (Termux):**
```bash
pkg update
pkg install nodejs git
git clone https://github.com/FeatureDev/Node_Android_project
cd Node_Android_project
npm install
npm run init-db
```

**På Dator:**
```bash
git clone https://github.com/FeatureDev/Node_Android_project
cd Node_Android_project
npm install
npm run init-db
```

#### **2. Installera Ngrok**

**På Telefon (Termux):**
```bash
# Download ngrok for Android ARM
pkg install wget
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz
tar -xvzf ngrok-v3-stable-linux-arm64.tgz
mv ngrok /data/data/com.termux/files/usr/bin/
chmod +x /data/data/com.termux/files/usr/bin/ngrok
```

**På Dator (Windows):**
1. Gå till: https://ngrok.com/download
2. Ladda ner för Windows
3. Extrahera och lägg i PATH eller kör från mappen

#### **3. Skapa gratis Ngrok-konto**

1. Gå till: https://dashboard.ngrok.com/signup
2. Skapa konto (gratis)
3. Kopiera din **authtoken** från dashboard

#### **4. Konfigurera Ngrok**

```bash
ngrok config add-authtoken <DIN_AUTHTOKEN>
```

#### **5. Starta Backend**

```bash
npm start
```

Backend körs nu på port 3000.

#### **6. Öppna Ngrok Tunnel (ny terminal/tab)**

**På Telefon:** Svajpa från vänster i Termux ? New session

**På Dator:** Öppna ny terminal/PowerShell

```bash
ngrok http 3000
```

**Ngrok visar din publika URL:**
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

**Kopiera HTTPS-URL:en!** (t.ex. `https://abc123.ngrok-free.app`)

---

### **Frontend (GitHub Pages)**

#### **1. Aktivera GitHub Pages**

- Gå till GitHub repo ? **Settings** ? **Pages**
- Source: `main` branch, `/docs` folder
- Click **Save**

#### **2. Uppdatera config.js med ngrok URL**

**På din dator:**

1. **Öppna:** `docs/js/config.js`

2. **Ändra:**
```javascript
NGROK_API: 'https://ABC123.ngrok-free.app', // DIN NGROK URL!
MODE: 'ngrok'  // Byt från 'local' till 'ngrok'
```

3. **Commit och push:**
```bash
git add docs/js/config.js
git commit -m "Update ngrok URL"
git push
```

#### **3. Vänta 1-2 minuter**

GitHub Pages deployas automatiskt.

#### **4. Öppna din webbshop!**

```
https://featuredev.github.io/Node_Android_project/index/index.html
```

**Nu fungerar det från VILKET WiFi SOM HELST! ??**

---

## **?? Viktigt om Ngrok (Gratis Tier)**

- **URL ändras** varje gång du startar om ngrok
- **Session timeout** efter ~8 timmar inaktivitet
- **40 requests/minut** limit på gratis tier
- **Statisk URL** kräver betald plan ($8/månad)

**Varje gång ngrok URL ändras:**
1. Kopiera ny URL från ngrok terminal
2. Uppdatera `docs/js/config.js`
3. Commit & push
4. Vänta 1-2 min ? GitHub Pages uppdateras

---

## **?? Snabb Omstart-Guide**

**När ngrok URL har ändrats:**

```bash
# 1. Kolla ny ngrok URL (i ngrok terminal)
# 2. Uppdatera config.js
sed -i 's|https://.*\.ngrok-free\.app|https://NEW-URL.ngrok-free.app|' docs/js/config.js

# 3. Push
git add docs/js/config.js
git commit -m "Update ngrok URL"
git push
```

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
