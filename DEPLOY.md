# ReviewPulse — Deployment Guide

> Komplette Schritt-für-Schritt Anleitung für das erste Live-Deployment.  
> Dauer: ca. 45–60 Minuten beim ersten Mal.

---

## Übersicht & Reihenfolge

```
Schritt 1  → Shopify Partner Account + App anlegen    (10 min)
Schritt 2  → Resend Account + Domain verifizieren     ( 5 min)
Schritt 3  → Stripe Account + Produkt anlegen         (10 min)
Schritt 4  → Railway: Backend + PostgreSQL deployen   (15 min)
Schritt 5  → Vercel: Frontend deployen                ( 5 min)
Schritt 6  → Alles verknüpfen (URLs eintragen)        ( 5 min)
Schritt 7  → Test-Installation in Dev-Shop            ( 5 min)
```

> **Wichtig:** Führe die Schritte genau in dieser Reihenfolge aus.  
> Du brauchst die URLs aus Schritt 4 und 5 für Schritt 6.

---

## Schritt 1 — Shopify Partner Account & App

### 1.1 Partner Account erstellen (falls noch nicht vorhanden)

1. Öffne **https://partners.shopify.com**
2. Klicke **"Join for free"**
3. Fülle das Formular aus → **"Create account"**
4. E-Mail bestätigen

### 1.2 Development Store erstellen (zum Testen)

1. Im Partner Dashboard: linke Sidebar → **"Stores"**
2. Klicke **"Add store"** → **"Development store"**
3. Store name: `reviewpulse-test` (oder beliebig)
4. Klicke **"Save"**
5. Notiere die URL: `reviewpulse-test.myshopify.com`

### 1.3 App anlegen

1. Linke Sidebar → **"Apps"**
2. Klicke **"Create app"** (oben rechts)
3. Wähle **"Create app manually"**
4. App name: `ReviewPulse`
5. Klicke **"Create app"**

Du siehst jetzt die App-Übersicht. **Noch nichts speichern.**

### 1.4 App-Credentials notieren

1. Tab **"Overview"** → Bereich **"Client credentials"**
2. Notiere:
   - **API key** (= `SHOPIFY_API_KEY`) → sieht aus wie: `abc123def456...`
   - **API secret key** (= `SHOPIFY_API_SECRET`) → klicke **"Reveal"** zum Anzeigen

### 1.5 App-Konfiguration (URLs — nach Schritt 4 & 5 ausfüllen)

> Komm nach Schritt 5 hierher zurück. Lass den Tab offen.

1. Tab **"Configuration"** → Bereich **"URLs"**
2. **App URL:** `https://DEINE-RAILWAY-URL.railway.app`
3. **Allowed redirection URLs:** `https://DEINE-RAILWAY-URL.railway.app/auth/callback`
4. Klicke **"Save and release"**

### 1.6 App-Berechtigungen (Scopes)

1. Tab **"Configuration"** → Bereich **"Admin API integration"**
2. Klicke **"Edit"**
3. Aktiviere folgende Checkboxen:
   - ✅ `read_orders`
   - ✅ `read_customers`
4. Klicke **"Save"**

---

## Schritt 2 — Resend (E-Mail-Versand)

### 2.1 Account erstellen

1. Öffne **https://resend.com**
2. Klicke **"Sign up"** → mit GitHub oder E-Mail registrieren
3. E-Mail bestätigen

### 2.2 Domain hinzufügen & verifizieren

1. Dashboard → linke Sidebar → **"Domains"**
2. Klicke **"Add Domain"**
3. Gib deine Domain ein, z.B. `yourdomain.com`
4. Wähle Region: **"EU (Frankfurt)"** (DSGVO-konform)
5. Klicke **"Add"**

Du siehst jetzt DNS-Einträge (SPF, DKIM, DMARC).

6. Melde dich bei deinem Domain-Registrar an (z.B. Namecheap, GoDaddy, Cloudflare)
7. Füge alle angezeigten DNS-Einträge hinzu (TXT + CNAME-Einträge)
8. Klicke in Resend auf **"Verify DNS Records"**

> DNS-Propagierung dauert 5–30 Minuten. Fahre mit Schritt 3 fort und komm zurück.

### 2.3 API Key erstellen

1. Dashboard → linke Sidebar → **"API Keys"**
2. Klicke **"Create API Key"**
3. Name: `reviewpulse-production`
4. Permission: **"Sending access"**
5. Klicke **"Add"**
6. **Notiere den Key sofort** (wird nur einmal angezeigt): `re_xxxxxxxxxxxx`
   → Das ist dein `RESEND_API_KEY`

### 2.4 Absender-E-Mail festlegen

- Dein `RESEND_FROM_EMAIL` wird sein: `noreply@yourdomain.com`
- Stelle sicher, dass die Domain aus 2.2 verifiziert ist

---

## Schritt 3 — Stripe (Zahlungsabwicklung)

### 3.1 Account erstellen

1. Öffne **https://stripe.com**
2. Klicke **"Start now"** → Registrieren
3. Dashboard öffnet sich

> ⚠️ Bleib vorerst im **Test-Modus** (Toggle oben links: "Test mode").

### 3.2 Produkt & Preis anlegen

1. Linke Sidebar → **"Product catalog"**
2. Klicke **"+ Add product"**
3. Ausfüllen:
   - **Name:** `ReviewPulse Pro`
   - **Description:** `Automated Google Review Requests for Shopify`
   - Bild: optional (Logo hochladen)
4. Unter **"Pricing"**:
   - **Pricing model:** Standard pricing
   - **Price:** `15.00`
   - **Currency:** `USD`
   - **Billing period:** `Monthly`
   - **Usage:** `Recurring`
5. Klicke **"Add product"**

6. Klicke auf das neu erstellte Produkt
7. Unter **"Pricing"** → klicke auf den Preis
8. **Notiere die Price ID:** `price_xxxxxxxxxxxx`  
   → Das ist dein `STRIPE_PRICE_ID`

### 3.3 API Keys notieren

1. Linke Sidebar → **"Developers"** → **"API keys"**
2. Notiere:
   - **Publishable key:** `pk_test_xxxx` (nur zur Info)
   - **Secret key:** klicke **"Reveal test key"** → `sk_test_xxxx`
     → Das ist dein `STRIPE_SECRET_KEY`

### 3.4 Webhook-Endpoint anlegen (nach Schritt 4 ausfüllen)

> Komm nach Schritt 4 hierher zurück. Lass den Tab offen.

1. Linke Sidebar → **"Developers"** → **"Webhooks"**
2. Klicke **"+ Add endpoint"**
3. **Endpoint URL:** `https://DEINE-RAILWAY-URL.railway.app/billing/webhook`
4. Klicke **"+ Select events"** und wähle:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Klicke **"Add endpoint"**
6. Klicke auf den neuen Endpoint
7. Unter **"Signing secret"** → klicke **"Reveal"**
8. **Notiere:** `whsec_xxxxxxxxxxxx`  
   → Das ist dein `STRIPE_WEBHOOK_SECRET`

### 3.5 Customer Portal aktivieren

1. Linke Sidebar → **"Settings"** → suche nach **"Customer portal"** (oder: Billing → Customer portal)
2. Klicke **"Activate test link"** (oder "Enable")
3. Konfiguriere nach Wunsch (Kündigung erlauben: ✅, Zahlungsmethode ändern: ✅)
4. Klicke **"Save"**

---

## Schritt 4 — Railway (Backend + PostgreSQL)

### 4.1 Railway Account

1. Öffne **https://railway.app**
2. Klicke **"Login"** → **"Login with GitHub"**
3. GitHub-Account autorisieren

### 4.2 Neues Projekt anlegen

1. Dashboard → Klicke **"New Project"**
2. Wähle **"Empty project"**
3. Projekt-Name (oben): `reviewpulse`

### 4.3 PostgreSQL-Datenbank hinzufügen

1. Im Projekt-Canvas: Klicke **"+ Add a Service"**  
   (oder **"+ New"** → **"Database"**)
2. Wähle **"PostgreSQL"**
3. Railway erstellt die DB automatisch.
4. Klicke auf den PostgreSQL-Service
5. Tab **"Connect"** → kopiere **"DATABASE_URL"**  
   → Sieht aus wie: `postgresql://postgres:PASSWORD@HOST:PORT/railway`  
   → Notiere für die nächste Schritte

### 4.4 Backend-Service anlegen

**Option A: GitHub (empfohlen)**

1. Pushe zuerst deinen Code zu GitHub:
   ```bash
   cd /Users/jeromefalkenstein/reviewpulse
   git init
   git add .
   git commit -m "Initial ReviewPulse deployment"
   gh repo create reviewpulse --private
   git push -u origin main
   ```
2. Im Railway-Projekt: Klicke **"+ Add a Service"** → **"GitHub Repo"**
3. Wähle `reviewpulse` Repository
4. **Root directory:** `backend`
5. Klicke **"Add service"**

**Option B: Railway CLI**

```bash
npm install -g @railway/cli
railway login
cd /Users/jeromefalkenstein/reviewpulse/backend
railway link   # wähle das Projekt aus
railway up
```

### 4.5 Umgebungsvariablen setzen

1. Klicke auf den Backend-Service
2. Tab **"Variables"**
3. Klicke **"+ New Variable"** und füge eine nach der anderen hinzu:

| Variable | Wert | Hinweis |
|----------|------|---------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | Railway überschreibt das ggf. automatisch |
| `DATABASE_URL` | `postgresql://...` | Von Schritt 4.3 |
| `DB_PROVIDER` | `postgresql` | |
| `SHOPIFY_API_KEY` | `abc123...` | Von Schritt 1.4 |
| `SHOPIFY_API_SECRET` | `shpss_...` | Von Schritt 1.4 |
| `SHOPIFY_SCOPES` | `read_orders,read_customers` | |
| `HOST` | `https://DEINE-RAILWAY-URL.railway.app` | Gleich ermitteln ↓ |
| `FRONTEND_URL` | `https://DEINE-VERCEL-URL.vercel.app` | Nach Schritt 5 |
| `RESEND_API_KEY` | `re_xxx...` | Von Schritt 2.3 |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Von Schritt 2.4 |
| `STRIPE_SECRET_KEY` | `sk_test_xxx...` | Von Schritt 3.3 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx...` | Von Schritt 3.4 |
| `STRIPE_PRICE_ID` | `price_xxx...` | Von Schritt 3.2 |
| `STRIPE_TRIAL_DAYS` | `14` | |
| `SESSION_SECRET` | *(langer zufälliger String)* | Generiere: `openssl rand -hex 32` |

> **Tipp für SESSION_SECRET:** Im Terminal ausführen:
> ```bash
> openssl rand -hex 32
> ```

4. Klicke nach dem letzten Eintrag **"Deploy"** (oder Railway deployed automatisch)

### 4.6 Railway-URL ermitteln

1. Klicke auf den Backend-Service
2. Tab **"Settings"** → Bereich **"Networking"**
3. Klicke **"Generate Domain"** (falls noch keine Domain)
4. Notiere: `https://reviewpulse-backend-production.up.railway.app`  
   → Das ist dein `HOST`

### 4.7 Deployment überprüfen

1. Tab **"Deployments"** → warte bis Status: **"Success"** ✅
2. Klicke auf das Deployment → **"View Logs"**
3. Du solltest sehen:
   ```
   ReviewPulse backend running on port 3001
   Database connected
   [Scheduler] Email scheduler started
   ```
4. Test: Öffne `https://DEINE-RAILWAY-URL.railway.app/health`  
   → Erwartete Antwort: `{"status":"ok","ts":"..."}`

---

## Schritt 5 — Vercel (Frontend)

### 5.1 Vercel Account

1. Öffne **https://vercel.com**
2. Klicke **"Sign Up"** → **"Continue with GitHub"**
3. GitHub autorisieren

### 5.2 Neues Projekt anlegen

**Option A: GitHub (empfohlen)**

1. Dashboard → Klicke **"Add New..."** → **"Project"**
2. Wähle unter **"Import Git Repository"** dein `reviewpulse` Repository
3. Klicke **"Import"**
4. **Root Directory:** Klicke **"Edit"** → wähle `frontend`
5. **Framework Preset:** Vite (wird automatisch erkannt)

**Option B: Vercel CLI**

```bash
npm install -g vercel
cd /Users/jeromefalkenstein/reviewpulse/frontend
vercel
# Fragen beantworten:
#   Set up and deploy? Y
#   Which scope? (dein Account)
#   Link to existing project? N
#   Project name: reviewpulse-frontend
#   Directory: ./
#   Override settings? N
```

### 5.3 Umgebungsvariablen setzen

1. Im Vercel-Projekt → Tab **"Settings"**
2. Linke Sidebar → **"Environment Variables"**
3. Füge hinzu:

| Variable | Wert |
|----------|------|
| `VITE_SHOPIFY_API_KEY` | Dein Shopify API Key (von Schritt 1.4) |
| `VITE_API_URL` | `https://DEINE-RAILWAY-URL.railway.app` (von Schritt 4.6) |

4. Klicke **"Save"**

### 5.4 Deployen

1. Zurück zum **"Deployments"** Tab
2. Klicke **"Redeploy"** (damit die neuen Env-Vars aktiv werden)
3. Warte bis: **"Ready"** ✅
4. Notiere deine Vercel-URL: `https://reviewpulse-frontend.vercel.app`

---

## Schritt 6 — Alles verknüpfen

### 6.1 Backend: FRONTEND_URL eintragen

1. Zurück zu Railway → Backend-Service → Tab **"Variables"**
2. Update `FRONTEND_URL` → `https://reviewpulse-frontend.vercel.app`
3. Update `HOST` → `https://DEINE-RAILWAY-URL.railway.app` (falls noch nicht gesetzt)
4. Railway re-deployed automatisch

### 6.2 Shopify: App-URLs eintragen (Schritt 1.5 vervollständigen)

1. Zurück zum Shopify Partner Dashboard → **"Apps"** → `ReviewPulse`
2. Tab **"Configuration"**
3. **App URL:** `https://DEINE-RAILWAY-URL.railway.app`
4. **Allowed redirection URLs:** `https://DEINE-RAILWAY-URL.railway.app/auth/callback`
5. Klicke **"Save and release"**

### 6.3 Stripe: Webhook-URL eintragen (Schritt 3.4 vervollständigen)

1. Zurück zu Stripe → **"Developers"** → **"Webhooks"**
2. Klicke **"+ Add endpoint"**
3. **Endpoint URL:** `https://DEINE-RAILWAY-URL.railway.app/billing/webhook`
4. Events auswählen (wie in Schritt 3.4 beschrieben)
5. Klicke **"Add endpoint"** → Notiere `STRIPE_WEBHOOK_SECRET`
6. Zurück zu Railway → Variable `STRIPE_WEBHOOK_SECRET` aktualisieren

### 6.4 Vercel: VITE_API_URL prüfen

1. Vercel → **"Settings"** → **"Environment Variables"**
2. `VITE_API_URL` sollte zeigen auf: `https://DEINE-RAILWAY-URL.railway.app`
3. Falls aktualisiert: **"Redeploy"**

---

## Schritt 7 — Test-Installation

### 7.1 App im Dev-Store installieren

1. Shopify Partner Dashboard → **"Apps"** → `ReviewPulse`
2. Klicke **"Select store"** (oben rechts)
3. Wähle deinen Development Store (`reviewpulse-test`)
4. Klicke **"Install app"**

Der Browser öffnet:  
`https://DEINE-RAILWAY-URL.railway.app/auth/begin?shop=reviewpulse-test.myshopify.com`

5. Shopify-OAuth-Seite: Klicke **"Install app"**

Du wirst weitergeleitet zu:  
`https://reviewpulse-frontend.vercel.app?shop=...&host=...`

### 7.2 Onboarding durchklicken

1. Du siehst den Onboarding-Wizard
2. **Schritt 1:** Gib eine Test-Google-Review-URL ein:  
   `https://g.page/r/TEST123/review`
3. **Schritt 2:** Absendername + Betreff ausfüllen
4. **Schritt 3:** Sendezeitpunkt wählen → **"Einrichtung abschließen"**
5. Dashboard öffnet sich ✅

### 7.3 Test-Bestellung auslösen

1. In Shopify Admin des Dev-Stores: **"Orders"** → **"Create order"**
2. Füge ein Produkt hinzu, gib Kundendaten mit E-Mail ein
3. Klicke **"Fulfill items"** → **"Fulfill"**

Das `orders/fulfilled` Webhook wird an dein Backend gesendet.

4. Im ReviewPulse Dashboard: Nach wenigen Minuten erscheint die Anfrage in der Tabelle

### 7.4 Email-Versand prüfen

- **Resend Dashboard** → **"Emails"** → Siehst du die gesendete Email?
- **Backend Logs** (Railway → Deployments → Logs):
  ```
  [Webhook] Review request scheduled for order #1001 (kunde@example.com)
  [Scheduler] Sent review email to kunde@example.com (order #1001)
  ```

---

## Schritt 8 — Live-Schaltung (Stripe Live-Modus)

Wenn du bereit bist, echte Zahlungen zu akzeptieren:

### 8.1 Stripe Live-Keys aktivieren

1. Stripe Dashboard → Toggle **"Test mode"** → **"Live mode"**
2. **"Developers"** → **"API keys"** → neuen **Live Secret Key** notieren: `sk_live_xxx`
3. Neues Produkt/Preis im Live-Modus anlegen (gleiche Schritte wie 3.2)
4. Neuen Live-Webhook anlegen (gleiche URL, gleiche Events)

### 8.2 Railway Variablen updaten

| Variable | Neuer Wert |
|----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` (Live-Webhook) |
| `STRIPE_PRICE_ID` | `price_xxx` (Live-Preis) |

### 8.3 Shopify App veröffentlichen

1. Shopify Partner Dashboard → **"Apps"** → `ReviewPulse`
2. Tab **"Distribution"**
3. Klicke **"Publish app"** → folge dem Prozess

> ⚠️ Für den Shopify App Store ist ein Review-Prozess erforderlich.  
> Für eigene Kunden kannst du einen **Direct Install Link** generieren.

---

## Troubleshooting

### Backend startet nicht

```bash
# Railway Logs prüfen
railway logs --tail

# Health Check
curl https://DEINE-RAILWAY-URL.railway.app/health
```

**Häufige Fehler:**
- `DATABASE_URL not set` → Variable in Railway setzen
- `Prisma migration failed` → Logs anschauen, meist DB-Verbindungsproblem
- `SHOPIFY_API_SECRET not set` → Variable prüfen

### Webhooks kommen nicht an

1. Shopify Partner Dashboard → App → Tab **"Webhooks"**
2. Prüfe ob Webhooks registriert sind
3. Testwebhook senden: Klicke **"Send test notification"**
4. Railway Logs prüfen

**Häufige Fehler:**
- HMAC-Verifikation schlägt fehl → `SHOPIFY_API_SECRET` prüfen
- 404 → `HOST` Variable prüft, URL korrekt?

### Emails werden nicht gesendet

1. Resend Dashboard → **"Emails"** → gibt es Fehler?
2. Domain verifiziert? → Resend → **"Domains"** → Status grün?
3. Railway Logs: `[Scheduler]` Zeilen prüfen

**Häufige Fehler:**
- `API key is invalid` → `RESEND_API_KEY` prüfen
- `Domain not verified` → DNS-Einträge abwarten (bis 30 min)
- `Email not sending` → `googleReviewUrl` in Shop-Settings gesetzt?

### Stripe Checkout funktioniert nicht

1. Stripe Dashboard → **"Developers"** → **"Logs"** → Fehler?
2. Webhook-Signatur falsch → `STRIPE_WEBHOOK_SECRET` prüfen
3. Test vs. Live-Modus → Keys passen zusammen?

### Frontend zeigt "Shop not found"

- App wurde nicht korrekt installiert → OAuth-Flow erneut starten:  
  `https://DEINE-RAILWAY-URL.railway.app/auth/begin?shop=DEIN-SHOP.myshopify.com`

---

## Checkliste vor Go-Live

```
□ Railway Backend deployed + Health Check grün
□ PostgreSQL Datenbank verbunden
□ Vercel Frontend deployed + erreichbar
□ Shopify App-URLs eingetragen (App URL + Redirect URL)
□ Shopify Scopes gesetzt (read_orders, read_customers)
□ Resend Domain verifiziert
□ Stripe Produkt + Preis angelegt
□ Stripe Webhook eingetragen + Secret gesetzt
□ Stripe Customer Portal aktiviert
□ Alle Railway Env-Vars gesetzt (15 Stück — siehe Schritt 4.5)
□ Test-Installation im Dev-Store erfolgreich
□ Test-Bestellung → Review-Anfrage erscheint im Dashboard
□ Test-Email empfangen
□ Onboarding-Flow komplett durchklickbar
□ /health gibt {"status":"ok"} zurück
```

---

## Schnell-Referenz: Alle URLs

| Service | URL |
|---------|-----|
| Backend Health | `https://DEINE-RAILWAY-URL.railway.app/health` |
| Backend Logs | Railway Dashboard → Deployments → Logs |
| OAuth Install | `https://DEINE-RAILWAY-URL.railway.app/auth/begin?shop=SHOP.myshopify.com` |
| Frontend | `https://DEINE-VERCEL-URL.vercel.app` |
| Stripe Dashboard | `https://dashboard.stripe.com` |
| Resend Dashboard | `https://resend.com/emails` |
| Railway Dashboard | `https://railway.app/dashboard` |
| Shopify Partners | `https://partners.shopify.com` |
