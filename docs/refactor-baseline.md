# Basis-Prompt fuer Refactors (React Native)

## Ziel
- Single Source of Truth (SST) und Single Responsibility (SRP) durch klare Trennung von UI, Logik und Datenaufbereitung.
- Lesbare, wartbare und testbare Struktur.

## Grundsaetze
- Keine neuen Libraries ohne Rueckfrage.
- Bestehende Navigation/Screens bleiben stabil; Refactor ueber Subcomponents/Hooks/Utils.
- Types nur als `type`, keine `interface`.
- Keine Annahmen bei Unklarheiten: Rueckfragen vor Aenderungen.
- Keine Web-only APIs (DOM/window/localStorage).

## Struktur-Empfehlung
- Screen bleibt in `client/screens/*` als schlanke Container-Datei.
- Feature-spezifische Teile in `client/features/<feature>/`:
  - `components/` fuer reine UI-Komponenten
  - `hooks/` fuer Logik/State/Side-Effects
  - `utils/` fuer pure Helpers/Formatierung
  - `types/` fuer lokale Typen (Suffix `T`)
  - `constants/` fuer lokale Konstanten/Maps

## SRP/SST Regeln
- Eine Datei = eine Verantwortung (UI/State/Helper trennen).
- Keine Duplikation von Formatierungs- oder Mapping-Logik.
- Datenaufbereitung in Hooks/Utils, nicht in JSX.

## UI-Komponenten
- Stateless wenn moeglich.
- Props strikt typisieren.
- Kein Navigation-Handling in UI-Komponenten.
- JSDoc fuer neue Components (Englisch).

## Hooks
- Eigener Hook fuer Screen-Logik (`use<Feature>Screen`).
- Side-Effects kapseln und sauber aufraeumen (AbortController/cleanup).
- Kein `setState` nach unmount.

## Styles
- Screen-Styles ausgelagert in `client/screens/styles/*`.
- Component-Styles lokal (z. B. `components/<name>.styles.ts`), nur wenn es den Component-Umfang rechtfertigt.

## Code-Qualitaet
- Keine Inline-Styles ausser minimal dynamisch.
- Keine Logik im Render ausser Mapping/kleine Guards.
- Keine doppelten Magic Numbers; Konstanten zentral.

## Tests
- Standard: optional, wenn nicht gefordert.
- Wenn Tests: `*.test.tsx` im selben Ordner wie die Datei.

