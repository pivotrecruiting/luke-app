# RevenueCat Paywall Implementation Plan

Stand: 2026-03-31

## Ziel

Dieser Plan beschreibt die saubere Implementierung einer RevenueCat-basierten Paywall fuer Luke mit:

- einem DB-gesteuerten Standard-Testzeitraum fuer jeden User
- Monthly Subscription
- Yearly Subscription
- Lifetime One-Time Purchase mit dauerhaftem Zugriff
- serverseitig synchronisiertem Zugriff ueber Supabase
- klarer Trennung zwischen Billing-Status und App-Access

## Aktueller Ist-Stand im Projekt

- `react-native-purchases` und `react-native-purchases-ui` sind in `package.json` installiert.
- [`client/screens/PaywallScreen.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/screens/PaywallScreen.tsx) ist aktuell statisch.
- Der CTA in der Paywall fuehrt aktuell nur `completeOnboarding()` aus und umgeht den Kauf-Flow.
- In Supabase existieren bereits vorbereitete Tabellen fuer `subscription_plans`, `revenuecat_customers`, `revenuecat_events`, `user_access_grants` und Workshop-Code-Zugriffe.
- In der Luke-Produktionsdatenbank gibt es aktuell noch keine RevenueCat-Customer und keine RevenueCat-Events.
- Es existieren aktuell keine Supabase Edge Functions fuer RevenueCat-Webhooks.
- In `subscription_plans` sind bereits drei aktive Produkte hinterlegt:
  - `monthly` fuer `2.99 EUR`
  - `yearly` fuer `29.99 EUR`
  - `lifetime` fuer `89.99 EUR`

## Architektur-Zielbild

### Source of Truth

- RevenueCat ist die Billing-Quelle fuer Store-Kaeufe und Subscription-Lifecycle.
- Supabase bleibt die App-interne Source of Truth fuer Zugriff in Luke.
- Die App soll Features nicht direkt aus Client-`CustomerInfo` freischalten.
- RevenueCat-Events werden serverseitig in `user_access_grants` ueberfuehrt.

### Zugriffsmodell

- Einheitlicher `access_key`: `pro`
- Monthly, Yearly, Lifetime und Workshop-Code sollen denselben Feature-Zugriff freischalten.
- Lifetime erzeugt einen Grant ohne `ends_at`.
- Monthly und Yearly erzeugen Grants mit sauberem Enddatum.
- Workshop-Codes bleiben erhalten und nutzen weiterhin dieselbe Access-Schicht.

### User Identity

- RevenueCat `app_user_id` soll exakt der Supabase `users.id` sein.
- Es soll kein produktiver Kauf-Flow mit anonymen RevenueCat-IDs zugelassen werden.
- Login, Session-Restore und Logout muessen RevenueCat-Identity konsistent halten.

## Produktmodell in RevenueCat

### Empfohlene Konfiguration

- Ein RevenueCat-Projekt fuer Luke
- Eine Entitlement-ID: `pro`
- Eine Standard-Offering fuer die Onboarding-Paywall, z. B. `default`
- Default Package Types statt eigener Package-Typen verwenden:
  - `monthly`
  - `annual`
  - `lifetime`

### Produkt-Typen

- Monthly: Auto-Renewable Subscription
- Yearly: Auto-Renewable Subscription
- Lifetime: Non-Consumable One-Time Purchase

### Testzeitraum

- Jeder User erhaelt einen Standard-Testzeitraum von 7 Tagen.
- Dieser Zeitraum soll aus der Datenbank geladen werden, damit er spaeter anpassbar bleibt.
- Die App soll das Paywall-Modal erst 3 Tage vor Ablauf dieses Testzeitraums anzeigen.
- Dieser Testzeitraum ist damit ein app-seitiger Access-Grant und kein Store-seitiger Intro-Offer-Mechanismus.
- RevenueCat bleibt fuer die spaetere Monetarisierung ab Kauf zustandig, nicht fuer die initiale Trial-Vergabe aus der DB.

## Wichtige Leitlinien

- Keine hardcodierten Preise, Laufzeiten, Trial-Tage oder Paywall-Fenster im UI.
- Kein `completeOnboarding()` vor verifiziertem Zugriff.
- Restore, Kauf und Access-Sync muessen getrennte, klar testbare Flows sein.
- Webhook-Verarbeitung muss idempotent sein.
- Rohdaten aller RevenueCat-Events muessen gespeichert werden.
- Access darf erst auf `EXPIRATION` oder entsprechendem finalen Zustand entzogen werden, nicht schon bei blosser Kuendigung.
- `BILLING_ISSUE` ist kein sofortiger Access-Entzug.
- Ein aus der DB gesteuerter Standard-Testzeitraum darf nicht mit Store-Trials vermischt werden, sonst entstehen widerspruechliche Zustaende.

## DB-Einschaetzung

### Was bereits gut ist

- `user_access_grants` ist als zentrale Access-Schicht ein guter Baustein.
- `revenuecat_events` als Event-Log ist fuer Audit und Idempotenz richtig.
- `revenuecat_customers` ist sinnvoll fuer das Mapping zwischen Supabase-User und RevenueCat-App-User.
- `get_my_access_state()` ist als serverseitiger Gatekeeper konzeptionell richtig.

### Was ich fuer RevenueCat anpassen wuerde

- Die bisherigen Tabellen `billing_customers`, `subscriptions`, `purchases`, `entitlements` und Teile von `subscription_plans` sind noch stark Stripe-gepraegt und sollten fuer RevenueCat nicht ungeprueft weiterverwendet werden.
- Fuer den DB-gesteuerten Testzeitraum fehlt aktuell eine globale Billing-/Paywall-Konfiguration.
- Fuer den Standard-Trial fehlt aktuell ein eigener sauberer `source_type`.
- Fuer das Paywall-Fenster fehlt aktuell ein serverseitiger, berechneter Sichtbarkeitszustand.
- Fuer RevenueCat-Produkte fehlt eine store-neutrale Produktabbildung; `stripe_product_id` und `stripe_price_id` passen semantisch nicht mehr.

### Empfohlene Zielanpassungen

- Eine globale Konfigurationstabelle fuer Trial und Paywall einfuehren.
- `subscription_plans` auf revenuecat-/store-neutrale Spalten umstellen oder durch eine neue Mapping-Tabelle ersetzen.
- Einen klaren Trial-Grant-Typ ergaenzen.
- Den Access-State-RPC um Trial- und Paywall-Sichtbarkeit erweitern.
- Optional eine dedizierte RevenueCat-Subscription-State-Tabelle einfuehren, wenn spaeter Support-, Reporting- oder Backoffice-Anforderungen steigen.

## Offene Produktentscheidungen vor Implementierung

- [x] Jeder User erhaelt einen Standard-Testzeitraum von 7 Tagen.
- [x] Das Paywall-Modal erscheint erst 3 Tage vor Trial-Ende.
- [ ] Entscheiden, ob zusaetzlich spaeter noch Store-seitige Intro Offers in RevenueCat/App Store/Play Store genutzt werden sollen oder bewusst nicht.
- [ ] Entscheiden, ob die Lifetime-Option auf beiden Plattformen gleichzeitig live gehen soll.
- [ ] Entscheiden, ob die Paywall waehrend Onboarding zwingend nach Login erscheint oder auch fuer nicht eingeloggte Nutzer sichtbar sein darf.
- [ ] Entscheiden, ob Workshop-Code-Nutzer die Paywall komplett ueberspringen sollen, sobald `get_my_access_state().has_access = true` liefert.

## Phasenplan

### Phase 0: Billing- und Access-Contract festziehen

- [ ] Finalen Business-Contract fuer `monthly`, `yearly`, `lifetime` und den app-seitigen Trial-Regeln dokumentieren.
- [ ] Entitlement `pro` als einziges Zugriffs-Entitlement definieren.
- [ ] RevenueCat `app_user_id = public.users.id` als feste Regel dokumentieren.
- [ ] Festlegen, dass Supabase `user_access_grants` die App-seitige Access-Quelle bleibt.
- [ ] Festlegen, dass der Standard-Testzeitraum nicht aus RevenueCat kommt, sondern aus Supabase-Konfiguration und `user_access_grants`.
- [ ] Festlegen, dass das Paywall-Modal nicht direkt bei Trial-Start, sondern erst ab `trial_end - 3 Tage` erscheinen darf.
- [ ] Bestehenden Stripe-MVP-Plan in [`docs/SUBSCRIPTIONS_PAYMENTS_PLAN.md`](/Users/dennisschaible/Desktop/Coding/luke/docs/SUBSCRIPTIONS_PAYMENTS_PLAN.md) als historisch betrachten und fuer RevenueCat nicht weiterverwenden.
- [ ] Ereignismapping definieren:
  - [ ] `INITIAL_PURCHASE`
  - [ ] `NON_RENEWING_PURCHASE`
  - [ ] `RENEWAL`
  - [ ] `PRODUCT_CHANGE`
  - [ ] `CANCELLATION`
  - [ ] `UNCANCELLATION`
  - [ ] `BILLING_ISSUE`
  - [ ] `TRANSFER`
  - [ ] `EXPIRATION`
- [ ] Entscheidung festhalten, wie Transfers zwischen RevenueCat-User-IDs behandelt werden sollen.

### Phase 1: RevenueCat Dashboard und Store-Produkte sauber aufsetzen

- [ ] Apple App Store Connect und Google Play Console Produkte final anlegen oder verifizieren.
- [ ] Store-Produkt-IDs nach stabilem Schema definieren.
- [ ] RevenueCat-Projekt fuer iOS und Android verbinden.
- [ ] Entitlement `pro` in RevenueCat anlegen.
- [ ] Offering `default` fuer Onboarding-Paywall anlegen.
- [ ] Monthly als Default Package Type `monthly` zuordnen.
- [ ] Yearly als Default Package Type `annual` zuordnen.
- [ ] Lifetime als Default Package Type `lifetime` zuordnen.
- [ ] Alle drei Produkte dem Entitlement `pro` zuordnen.
- [ ] Keine verpflichtende Abhaengigkeit von Store-Trials fuer den Standard-7-Tage-Testzeitraum einbauen.
- [ ] Offering-Metadata hinterlegen, falls die Paywall Badges oder Copy aus dem Dashboard beziehen soll.
- [ ] RevenueCat Test Store / Sandbox-Nutzer fuer iOS und Android vorbereiten.
- [ ] Sicherstellen, dass Preise im RevenueCat-Catalog exakt zu `subscription_plans` passen.

### Phase 2: Supabase als Access-Layer vorbereiten

- [ ] Bestehende Tabellenstruktur auf RevenueCat-Produktionsfluss ausrichten.
- [ ] Globale Billing-Konfiguration einfuehren, z. B. `billing_config` oder `paywall_config`, mit mindestens:
  - [ ] `default_trial_days`
  - [ ] `paywall_show_days_before_expiry`
  - [ ] `pro_entitlement_key`
- [ ] Sicherstellen, dass diese Konfiguration serverseitig geladen wird und nicht aus hartem Client-Code kommt.
- [ ] Eigenen `source_type` fuer Standard-Trial ergaenzen, z. B. `app_trial` oder `system_trial`.
- [ ] Regeln definieren, dass jeder User den Standard-Trial genau einmal bekommt.
- [ ] Pruefen, ob dafuer ein eigenes `user_trial_state`-Modell sinnvoll ist oder ob `user_access_grants` + Metadata reicht.
- [ ] Pruefen, ob `revenuecat_customers` zusaetzliche Felder braucht:
  - [ ] Plattform
  - [ ] letzter Event-Typ
  - [ ] letzter Entitlement-Status
  - [ ] Sandbox/Production-Markierung
- [ ] Pruefen, ob `user_access_grants.metadata` fuer RevenueCat standardisiert werden soll.
- [ ] `user_access_grants.metadata` fuer app-seitige Trials standardisieren, z. B.:
  - [ ] `trial_days`
  - [ ] `paywall_visible_from`
  - [ ] `granted_by`
- [ ] Pruefen, ob ein eindeutiger Constraint gegen doppelte aktive RevenueCat-Grants sinnvoll ist.
- [ ] Dokumentieren, wie RevenueCat-Lifetime-Grants in `user_access_grants` aussehen.
- [ ] Dokumentieren, wie Standard-Trial-Grants in `user_access_grants` aussehen.
- [ ] Dokumentieren, wie Subscription-Upgrades und Product Changes in bestehende Grants ueberfuehrt werden.
- [ ] Sicherstellen, dass `get_my_access_state()` fuer RevenueCat-Grants unveraendert korrekt funktioniert.
- [ ] `get_my_access_state()` oder eine neue RPC erweitern, damit neben `has_access` auch gesteuerte Paywall-Sichtbarkeit geliefert wird:
  - [ ] `trial_ends_at`
  - [ ] `paywall_visible`
  - [ ] `paywall_visible_from`
  - [ ] `days_until_expiry`
- [ ] Falls noetig, SQL-Helferfunktion fuer RevenueCat-Upserts definieren, damit die Webhook-Funktion schlank bleibt.

### Phase 3: RevenueCat Webhook in Supabase implementieren

- [ ] Neue Edge Function `revenuecat-webhook` planen.
- [ ] Function als oeffentlichen Webhook-Endpunkt bereitstellen.
- [ ] RevenueCat-Webhook-Signatur bzw. Request-Authentifizierung gemaess RevenueCat-Setup validieren.
- [ ] Raw Payload unveraendert in `public.revenuecat_events` speichern.
- [ ] Idempotenz ueber `event_id` erzwingen.
- [ ] `revenuecat_customers` per `app_user_id` upserten.
- [ ] Event-Mapping zu `user_access_grants` implementieren:
  - [ ] `INITIAL_PURCHASE` erzeugt oder aktualisiert aktiven Grant.
  - [ ] `RENEWAL` verlaengert bestehenden Grant.
  - [ ] `NON_RENEWING_PURCHASE` erzeugt Lifetime-Grant ohne `ends_at`.
  - [ ] `PRODUCT_CHANGE` beendet alten periodischen Grant sauber und aktiviert den neuen.
  - [ ] `CANCELLATION` markiert nur den kuenftigen Status, entzieht nicht blind den Zugriff.
  - [ ] `BILLING_ISSUE` erzeugt keinen sofortigen Access-Verlust.
  - [ ] `EXPIRATION` entzieht den Zugriff.
  - [ ] `TRANSFER` wird auditiert und auf Alias-/Identity-Konflikte geprueft.
- [ ] Fehlerfaelle in `processing_error` speichern.
- [ ] Test-Event aus RevenueCat Dashboard gegen Supabase verifizieren.

### Phase 4: Client-SDK-Grundlage in React Native aufbauen

- [ ] RevenueCat-Konfiguration fuer Expo-Setup pruefen.
- [ ] Falls fuer das aktuelle Setup erforderlich, Expo-Plugin oder Native-Konfiguration in [`app.config.js`](/Users/dennisschaible/Desktop/Coding/luke/app.config.js) ergaenzen.
- [ ] Environment-Variablen definieren:
  - [ ] `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- [ ] Neue Service-Schicht einfuehren, z. B. `client/services/revenuecat-service.ts`.
- [ ] SDK genau einmal initialisieren.
- [ ] Initialisierung erst starten, wenn Supabase-Session bekannt ist.
- [ ] SDK mit Supabase-`user.id` als `app_user_id` konfigurieren oder einloggen.
- [ ] Debug-Logs nur in Development aktivieren.
- [ ] `CustomerInfo`-Refresh und `Offerings`-Fetch kapseln.
- [ ] Listener fuer CustomerInfo-Updates registrieren.
- [ ] Fehler- und Timeout-Verhalten definieren.
- [ ] Kein Pricing aus lokalem Code mehr anzeigen, wenn Offering-Daten fehlen.
- [ ] Client-Flow klar trennen:
  - [ ] Trial-/Paywall-Sichtbarkeit aus Supabase
  - [ ] Kauf-/Restore-Flow aus RevenueCat

### Phase 5: Auth- und Identity-Sync sauber machen

- [ ] Login-Flow mit RevenueCat-Identity verbinden.
- [ ] Session-Restore mit RevenueCat-Identity verbinden.
- [ ] Logout-Flow sauber behandeln.
- [ ] Bei erstem qualifizierten App-Start oder nach Signup den Standard-Trial serverseitig vergeben.
- [ ] Sicherstellen, dass ein User nach Reinstall oder Login auf anderem Geraet dieselben Entitlements sieht.
- [ ] Sicherstellen, dass kein Kauf unter falscher oder alter `app_user_id` passiert.
- [ ] Klar festlegen, ob `syncPurchases` / Restore nur manuell oder auch nach Login genutzt wird.
- [ ] Workshop-Code-Flow und RevenueCat-Identity zusammendenken, damit kein Access-Konflikt entsteht.

### Phase 6: `PaywallScreen` auf echte RevenueCat-Daten umstellen

- [ ] [`client/screens/PaywallScreen.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/screens/PaywallScreen.tsx) von statisch auf Offering-basiert umbauen.
- [ ] Auswahlkarten nicht mehr aus fixen Preisen, sondern aus `availablePackages` rendern.
- [ ] Package-Mapping robust machen:
  - [ ] monthly
  - [ ] annual
  - [ ] lifetime
- [ ] Reihenfolge kontrolliert halten, aber nicht auf harte Produkt-IDs vertrauen.
- [ ] Badge-Logik fuer `best value` oder Trial aus Offering/Product-Daten ableiten.
- [ ] CTA-Text dynamisch machen.
- [ ] Trial-Copy aus DB-gesteuerter Testlogik ableiten, nicht aus RevenueCat-Store-Trials.
- [ ] Copy fuer das 3-Tage-Fenster sauber abbilden, z. B. verbleibende Testtage bis Ablauf.
- [ ] Wenn kein DB-State geladen werden kann, neutrale Copy verwenden statt falscher Versprechen.
- [ ] Kauf-Button gegen Doppelklick schuetzen.
- [ ] Loading-, Error- und Empty-State fuer Offerings implementieren.
- [ ] Cancelled Purchase, Pending Purchase und Purchase Error sauber behandeln.
- [ ] `Restore purchases` mit echtem RevenueCat-Flow verbinden.
- [ ] AGB- und Datenschutz-Links auf echte URLs legen.
- [ ] `completeOnboarding()` erst nach bestaetigtem Zugriff ausfuehren.
- [ ] Accessibility und `testID`s fuer alle Kaufoptionen ergaenzen.

### Phase 7: Access-Gating in die App integrieren

- [ ] App-Start auf serverseitigen Access- und Paywall-State stuetzen.
- [ ] Solange aktiver Trial besteht und `paywall_visible = false`, keine Paywall anzeigen.
- [ ] Sobald Trial aktiv ist und das 3-Tage-Fenster erreicht ist, Paywall modal anzeigen.
- [ ] Wenn `has_access = false` und kein aktiver Trial mehr besteht, Paywall anzeigen.
- [ ] Wenn `has_access = true` und kein Paywall-Fenster aktiv ist, Paywall ueberspringen.
- [ ] Workshop-Code-Grant, Subscription und Lifetime exakt gleich behandeln.
- [ ] Nach erfolgreichem Kauf nicht nur auf Client-Callback vertrauen.
- [ ] Nach Kauf aktiv auf serverseitige Access-Bestaetigung warten.
- [ ] Timeout-Strategie fuer den Fall definieren, dass Webhook oder Sync verzoegert ist.
- [ ] Falls gewuenscht, CustomerInfo als kurzfristige Optimierung nutzen, aber nicht als finale Freischaltung.

### Phase 8: Customer Self-Service ergaenzen

- [ ] Restore Flow fuer Altkaeufe verifizieren.
- [ ] Customer Center evaluieren und bei Bedarf integrieren.
- [ ] Falls integriert, `react-native-purchases-ui` fuer `presentCustomerCenter()` nutzen.
- [ ] Profilscreen spaeter um `Manage Subscription` erweitern.
- [ ] Klar kommunizieren, dass Aenderungen und Kuendigungen store-seitig verwaltet werden.

### Phase 9: Tests und Qualitaetssicherung

- [ ] Testmatrix fuer iOS und Android erstellen.
- [ ] Folgende Faelle einzeln testen:
  - [ ] Monthly Kauf
  - [ ] Yearly Kauf
  - [ ] Lifetime Kauf
  - [ ] Standard-Trial Start aus DB
  - [ ] Paywall bleibt in den ersten 4 Trial-Tagen unsichtbar
  - [ ] Paywall wird ab 3 Tagen Restlaufzeit sichtbar
  - [ ] Trial-Ende ohne Kauf
  - [ ] Restore nach Reinstall
  - [ ] Login auf zweitem Geraet
  - [ ] Cancellation
  - [ ] Billing Issue
  - [ ] Expiration
  - [ ] Product Change Monthly <-> Yearly
  - [ ] Transfer / Alias-Fall
  - [ ] Workshop-Code + RevenueCat nebeneinander
- [ ] Verifizieren, dass `revenuecat_events` jeden Testfall sauber loggt.
- [ ] Verifizieren, dass `user_access_grants` in jedem Fall den erwarteten Endzustand hat.
- [ ] Verifizieren, dass `get_my_access_state()` immer mit den Grants uebereinstimmt.
- [ ] UI-Tests fuer Paywall-States schreiben.
- [ ] Negative Tests fuer Netzwerkfehler und leere Offerings schreiben.

### Phase 10: Rollout und Monitoring

- [ ] Zuerst nur in Sandbox / Internal Testing ausrollen.
- [ ] RevenueCat Dashboard, Supabase Logs und DB-Zustaende parallel beobachten.
- [ ] Vor Production-Go-Live Test-Events und echte Sandbox-Kaeufe erneut durchspielen.
- [ ] Monitoring fuer Webhook-Fehler definieren.
- [ ] Monitoring fuer haengende `processing_error`-Events definieren.
- [ ] Monitoring fuer Nutzer ohne Access trotz erfolgreichem Kauf definieren.
- [ ] Soft-Launch mit kleiner Nutzergruppe in Betracht ziehen.

## Konkrete Code-Touchpoints

- [ ] [`client/screens/PaywallScreen.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/screens/PaywallScreen.tsx)
- [ ] [`client/screens/styles/paywall-screen.styles.ts`](/Users/dennisschaible/Desktop/Coding/luke/client/screens/styles/paywall-screen.styles.ts)
- [ ] [`client/context/AuthContext.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/context/AuthContext.tsx)
- [ ] [`client/context/AppContext.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/context/AppContext.tsx)
- [ ] [`client/navigation/RootStackNavigator.tsx`](/Users/dennisschaible/Desktop/Coding/luke/client/navigation/RootStackNavigator.tsx)
- [ ] [`client/lib/supabase.ts`](/Users/dennisschaible/Desktop/Coding/luke/client/lib/supabase.ts)
- [ ] [`app.config.js`](/Users/dennisschaible/Desktop/Coding/luke/app.config.js)
- [ ] neue Datei `client/services/revenuecat-service.ts`
- [ ] neue Datei `supabase/functions/revenuecat-webhook/index.ts` oder aequivalente Function-Struktur
- [ ] neue SQL-Migration(en) fuer RevenueCat-spezifische Constraints/Helper

## Explizite Anti-Patterns

- [ ] Keine Hardcodes wie `€ 29,99/Jahr` als produktive UI-Quelle behalten.
- [ ] Keine Freischaltung allein aufgrund eines erfolgreichen Client-Purchase-Callbacks.
- [ ] Keine Entitlement-Pruefung nur aus lokalem React-State.
- [ ] Kein anonymer RevenueCat-Kauf-Flow fuer authentifizierte Luke-User.
- [ ] Kein sofortiger Access-Entzug bei `CANCELLATION`, solange die laufende Periode aktiv ist.
- [ ] Keine zweite parallele Access-Logik neben `user_access_grants`.
- [ ] Den DB-gesteuerten Standard-Trial nicht gleichzeitig als Store-Trial nachbauen.

## Definition of Done

- [ ] Ein Nutzer kann Monthly, Yearly oder Lifetime ueber RevenueCat kaufen.
- [ ] Jeder Nutzer erhaelt genau einen DB-gesteuerten Standard-Testzeitraum von 7 Tagen.
- [ ] Das Paywall-Modal erscheint erst 3 Tage vor Trial-Ende.
- [ ] Die Paywall zeigt Preise und Kaufoptionen dynamisch aus RevenueCat.
- [ ] Nach erfolgreichem Kauf wird Zugriff serverseitig in Supabase synchronisiert.
- [ ] `get_my_access_state()` entscheidet korrekt ueber Paywall vs. App-Zugriff.
- [ ] Restore funktioniert nach Reinstall und auf einem zweiten Geraet.
- [ ] Lifetime bleibt dauerhaft aktiv.
- [ ] Monthly und Yearly laufen sauber ueber Renewal, Cancellation und Expiration.
- [ ] Alle relevanten RevenueCat-Events sind auditierbar gespeichert.

## Empfohlene Implementierungsreihenfolge

- [ ] Phase 0
- [ ] Phase 1
- [ ] Phase 2
- [ ] Phase 3
- [ ] Phase 4
- [ ] Phase 5
- [ ] Phase 6
- [ ] Phase 7
- [ ] Phase 9
- [ ] Phase 8
- [ ] Phase 10
