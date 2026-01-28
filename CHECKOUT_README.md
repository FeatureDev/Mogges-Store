# ?? Checkout System - Mogges Store

## ? Funktioner

### 1. **Betalning**
- Swish QR-kod (`picture/swish-QR.png`)
- Beräknar automatiskt:
  - Delsumma
  - Frakt (gratis över 500 kr)
  - Moms (25%)
  - Totalt belopp

### 2. **Ordersammanfattning**
- Visar alla produkter från varukorgen
- Produktbilder
- Antal per produkt
- Pris per rad

### 3. **Validering**
- Omdirigerar till varukorg om den är tom
- Laddar produkter från API
- Felhantering om servern är nere

## ?? Teknisk Implementation

### API Integration
```javascript
const API_URL = `${API_BASE_URL}/api/products`;
```

### Dataflöde
1. **Ladda produkter** från API
2. **Hämta varukorg** från localStorage
3. **Matcha produkter** med varukorg-items
4. **Visa ordersammanfattning** med bilder och priser
5. **Bekräfta betalning** ? Töm varukorg ? Omdirigera

### Viktiga funktioner

#### loadProducts()
Asynkron funktion som laddar alla produkter från backend API.

#### loadOrderItems()
- Hämtar varukorg från localStorage
- Matchar med produktdata från API
- Renderar HTML för ordersammanfattningen
- Hanterar tomma varukorgar

#### calculateTotals()
Beräknar:
- Delsumma
- Frakt (49 kr, gratis över 500 kr)
- Moms (25%)
- Total summa

#### Payment Confirmation
- 2 sekunders delay (simulerad betalning)
- Tömmer varukorgen
- Omdirigerar till startsidan

## ?? Förutsättningar

### Backend måste köra:
```sh
npm start
```

### Konfiguration:
Se till att `docs/js/config.js` pekar på rätt API:
```javascript
const CONFIG = {
    MODE: 'local'  // eller 'phone' eller 'ngrok'
};
```

## ??? Bildvägar

**Swish QR-kod:**
```
picture/swish-QR.png
```

**Produktbilder:**
```
picture/1.jpg
picture/2.jpg
...
```

Om bilden saknas visas placeholder.

## ?? Testning

### Scenario 1: Normal betalning
1. Lägg produkter i varukorg
2. Gå till varukorg
3. Klicka "Gå till Kassan"
4. Verifiera att produkter visas med bilder
5. Kontrollera att totalsumman är korrekt
6. Klicka "Bekräfta betalning"
7. Varukorg töms och omdirigeras till startsida

### Scenario 2: Tom varukorg
1. Gå direkt till `/checkout.html` utan produkter
2. Ska omdirigera till `/cart.html`

### Scenario 3: Servern är nere
1. Stäng av servern
2. Gå till checkout
3. Ska visa felmeddelande om produkter inte kan laddas

## ?? Felsökning

### Problem: Inga bilder visas
**Lösning:** Kontrollera att servern körs och att bildvägarna är korrekta.

### Problem: "Varukorgen är tom"
**Lösning:** Kontrollera localStorage i DevTools ? Application ? Local Storage

### Problem: Totalsumma fel
**Lösning:** Kolla Console för beräkningsloggar (?? Calculations:)

## ?? Säkerhet

?? **OBS! Detta är en demo-implementation:**
- Ingen riktig betalningsintegration
- Betalning är simulerad (2 sek timeout)
- I produktion: Använd Stripe, Klarna eller Swish API

## ?? TODO för produktion

- [ ] Integrera riktig Swish API
- [ ] Generera QR-kod dynamiskt
- [ ] Spara ordrar i databas
- [ ] Skicka orderbekräftelse via email
- [ ] Lägg till orderhistorik för användare
- [ ] Validera lagersaldo innan betalning
- [ ] Lägg till fler betalmetoder (kort, faktura)

---

**Skapad:** 2026-01-31
**Version:** 1.0
