# iOS TestFlight Deploy Guide

## Ziel

Diese Anleitung beschreibt den wiederholbaren Ablauf, um eine neue iOS-Version von `Luke` zu bauen, zu App Store Connect hochzuladen und in TestFlight zu verteilen.

Projekt-relevante Eckdaten:

- Expo/EAS Build wird verwendet
- `eas.json` nutzt `appVersionSource: "local"`
- Bundle Identifier: `com.deni.luke`
- EAS Submit Profil: `production`

## Wichtige Grundregeln

- Fuer jeden neuen TestFlight-Upload muss die iOS-`buildNumber` erhoeht werden.
- Die sichtbare App-Version (`version`) muss nur erhoeht werden, wenn eine neue fachliche Release-Version ausgerollt werden soll, zum Beispiel `1.0.0` -> `1.0.1`.
- Da `appVersionSource` auf `local` steht, sind die Versionswerte in `app.json` die massgebliche Quelle.
- `package.json` sollte auf derselben semantischen Version wie `app.json` gehalten werden, damit Projekt- und App-Version konsistent bleiben.
- Der `bundleIdentifier` darf nicht veraendert werden, solange dieselbe App in App Store Connect aktualisiert wird.

## Relevante Dateien

- `app.json`
- `package.json`
- `eas.json`
- optional `app.config.js` fuer umgebungsabhaengige Konfiguration

## 1. Vor jedem Release

Vor jedem neuen Deploy diese Checks durchgehen:

1. Sicherstellen, dass der richtige Branch aktiv ist.
2. Alle gewuenschten Aenderungen committen.
3. Optional, aber empfohlen: Lint und Typecheck lokal ausfuehren.
4. Pruefen, ob die Release-Version angepasst werden muss.

Empfohlene lokale Checks:

```bash
npm run lint
npm run check:types
```

## 2. Versionsnummern aktualisieren

### Wann `version` erhoehen?

`expo.version` in `app.json` und `package.json` sollte erhoeht werden, wenn die Release fachlich eine neue Version darstellen soll.

Beispiele:

- Bugfix-Release: `1.0.0` -> `1.0.1`
- Kleinere neue Features: `1.0.0` -> `1.1.0`
- Groessere Aenderung: `1.0.0` -> `2.0.0`

### Wann `ios.buildNumber` erhoehen?

`ios.buildNumber` in `app.json` muss fuer jeden neuen Upload nach App Store Connect eindeutig hoeher sein als beim letzten iOS-Upload.

Beispiele:

- letzter Upload `buildNumber: "1"` -> naechster Upload `buildNumber: "2"`
- danach `3`, `4`, `5`, usw.

### Android-Hinweis

Wenn parallel ein Android-Release vorbereitet wird, auch `android.versionCode` in `app.json` hochzaehlen.

### Konkrete Felder

In `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

In `package.json`:

```json
{
  "version": "1.0.1"
}
```

## 3. Build fuer iOS erstellen

Den produktiven iOS-Build mit EAS starten:

```bash
npx eas build --platform ios --profile production
```

Optional kann vorher geprueft werden:

```bash
npx eas --version
npx eas whoami
```

Wenn der Build erfolgreich ist, liefert EAS einen Build-Link und ein `.ipa`-Artefakt.

Wichtig:

- Die `.ipa` ist das fertige iOS-Release-Artefakt.
- Diese Datei wird nicht manuell bearbeitet.
- Fuer TestFlight kann sie entweder ueber EAS Submit oder alternativ ueber Apple Transporter hochgeladen werden.

## 4. Build zu App Store Connect hochladen

Empfohlener Weg:

```bash
npx eas submit --platform ios --latest --profile production
```

Erklaerung:

- `--latest` nimmt den zuletzt erfolgreichen iOS-Build auf EAS
- `--profile production` nutzt das Submit-Profil aus `eas.json`

Alternative, falls ein bestimmtes Build-Artefakt verwendet werden soll:

```bash
npx eas submit --platform ios --profile production
```

## 5. Alternative: Upload mit Apple Transporter

Falls `eas submit` nicht verwendet werden soll:

1. Die `.ipa` ueber den EAS-Link herunterladen.
2. `Transporter` aus dem Mac App Store oeffnen.
3. Mit dem Apple-Developer-Account anmelden.
4. Die `.ipa` in `Transporter` ziehen.
5. Upload mit `Deliver` starten.

## 6. App Store Connect: TestFlight freigeben

Nach dem Upload:

1. `App Store Connect` oeffnen.
2. Die App `Luke` waehlen.
3. Zum Bereich `TestFlight` wechseln.
4. Warten, bis der neue Build verarbeitet wurde.
5. Den Build einer Testgruppe zuweisen.

Wichtige Hinweise:

- Die Verarbeitung in App Store Connect dauert oft zwischen 5 und 30 Minuten.
- `Internal Testers` koennen meist schnell hinzugefuegt werden.
- `External Testers` benoetigen in der Regel einen Beta App Review durch Apple.

## 7. Empfohlener Standardablauf

Das ist der kuerzeste, wiederholbare Release-Flow:

1. Code finalisieren
2. `app.json` aktualisieren:
   `version` bei Bedarf erhoehen
   `ios.buildNumber` immer erhoehen
3. `package.json` Version an `app.json` angleichen
4. Optional `npm run lint` und `npm run check:types`
5. Build starten:

```bash
npx eas build --platform ios --profile production
```

6. Nach erfolgreichem Build submitten:

```bash
npx eas submit --platform ios --latest --profile production
```

7. In `App Store Connect` unter `TestFlight` den Build einer Testergruppe zuweisen

## 8. Checkliste vor jedem Upload

- `app.json` `expo.version` korrekt?
- `app.json` `ios.buildNumber` gegenueber dem letzten Upload erhoeht?
- `package.json` Version synchron zu `app.json`?
- Richtiger Expo-Account eingeloggt?
- Richtiger Apple-Developer-Account verwendet?
- `bundleIdentifier` weiterhin `com.deni.luke`?
- Aenderungen im richtigen Branch und Commit-Stand?

## 9. Typische Fehler

### Fehler: Build request failed

Moegliche Ursachen:

- temporaeres EAS-Problem
- alte `eas-cli`
- Authentifizierungsproblem bei Expo/EAS

Hilfreiche Befehle:

```bash
npx eas --version
npx eas whoami
npx eas build --platform ios --profile production
```

### Fehler: Upload wird von App Store Connect abgelehnt

Pruefen:

- `ios.buildNumber` wurde wirklich erhoeht
- App Store Connect verarbeitet noch den vorherigen Build
- Account-, Vertrags- oder Berechtigungsprobleme bei Apple

### Fehler: Build erscheint nicht in TestFlight

Pruefen:

- Upload war wirklich erfolgreich
- Build wird noch verarbeitet
- richtige App in App Store Connect geoeffnet
- Bundle Identifier stimmt exakt

## 10. Release-Notizen dokumentieren

Empfohlen pro Release:

- geaenderte `version`
- neue `buildNumber`
- Datum des Uploads
- kurzer Changelog
- Link zum EAS-Build

Beispiel:

```md
Release 1.0.1
BuildNumber iOS: 2
Datum: 2026-04-01
EAS Build: <build-url>
Notizen: Bugfixes im Profil und Account-Flow
```

## 11. Schnellreferenz

Versionen aktualisieren in:

- `app.json`
- `package.json`

Build:

```bash
npx eas build --platform ios --profile production
```

Submit:

```bash
npx eas submit --platform ios --latest --profile production
```
