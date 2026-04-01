# iOS TestFlight ohne EAS

## Ziel

Diese Anleitung beschreibt den einfachsten lokalen Weg, um `Luke` ohne `eas build` und ohne `eas submit` nach `TestFlight` hochzuladen.

Der Flow ist:

`Expo prebuild` -> `Xcode Archive` -> `App Store Connect`

## Voraussetzungen

- Mac mit installiertem `Xcode`
- bezahlter Apple Developer Account
- App Store Connect App mit Bundle Identifier `com.deni.luke`

## Vor jedem Upload

1. In `app.json` die `ios.buildNumber` erhoehen.
2. Bei Bedarf auch `version` erhoehen.
3. Optional lokal pruefen:

```bash
npm run lint
npm run check:types
```

## 1. Native iOS-Dateien erzeugen

Im Projekt ausfuehren:

```bash
npx expo prebuild -p ios
```

Dadurch wird der `ios/`-Ordner erzeugt.

## 2. Xcode oeffnen

```bash
xed ios
```

In Xcode pruefen:

- richtiges App-Target waehlen
- `Signing & Capabilities` oeffnen
- Apple Team auswaehlen
- automatische Signierung aktiv lassen
- Bundle Identifier `com.deni.luke` pruefen

## 3. Release archivieren

In Xcode:

1. Zielgeraet auf `Generic iOS Device` stellen, nicht Simulator.
2. `Product` -> `Archive` ausfuehren.

Wenn der Build erfolgreich ist, oeffnet sich der `Organizer`.

## 4. Zu TestFlight hochladen

Im `Organizer`:

1. Das neue Archive waehlen.
2. `Distribute App` klicken.
3. `App Store Connect` waehlen.
4. Upload bestaetigen.

Danach in `App Store Connect` unter `TestFlight` warten, bis Apple den Build verarbeitet hat.

## Wichtige Hinweise

- `ios.buildNumber` muss bei jedem Upload hoeher sein als beim letzten iOS-Upload.
- Der Upload funktioniert nicht mit dem Simulator.
- `expo run:ios` ist kein TestFlight-Release-Flow.
- `expo prebuild` erzeugt native Dateien und aendert den lokalen Workflow.

## Kurzfassung

```bash
npx expo prebuild -p ios
xed ios
```

Dann in Xcode:

`Signing & Capabilities` pruefen -> `Generic iOS Device` waehlen -> `Product > Archive` -> `Distribute App`
