# Funktionalitätsübersicht (grob)

Ziel: Schneller Einstieg, welche Dateien/Ordner die Kernfunktionalität tragen, als Basis für spätere Dataflow- und Userflow-Dokumentation.

## Client (Expo/React Native App)

| Pfad | Übergeordnete Funktionalität |
| --- | --- |
| `client/index.js` | Expo Entry Point; registriert die Root-Komponente der App. |
| `client/App.tsx` | Root-Setup: Provider (Navigation, React Query, AppContext, ErrorBoundary), globales App-Shell. |
| `client/navigation/RootStackNavigator.tsx` | Zentrale Flow-Weiche: Onboarding vs. Main; Detail-Screens/Modals. |
| `client/navigation/OnboardingNavigator.tsx` | Onboarding-Flow (Welcome → SignUp → Onboarding Steps → Paywall). |
| `client/navigation/MainTabNavigator.tsx` | Hauptnavigation per Tabs (Home, Insights, Add, Goals, Profile). |
| `client/context/AppContext.tsx` | Zentrale State- und Datenlogik inkl. AsyncStorage-Persistenz, Mutationen für Budgets/Goals/Transaktionen. |
| `client/lib/query-client.ts` | API-Base-URL + Fetch-Wrapper + React Query Client; Schnittstelle zu Server-APIs. |
| `client/screens/*` | Userflows & Screens (Onboarding, Home/Insights/Add/Goals/Profile, Detail/Income/Expenses). |
| `client/components/*` | Wiederverwendbare UI-Komponenten (Buttons, Cards, ErrorBoundary, etc.). |
| `client/hooks/*` | UI- und Theme-Helper (Color-Scheme, Screen Options). |
| `client/constants/*` | Statische Konfiguration (Theme, Budget-Kategorien). |

## Server (Express + Static)

| Pfad | Übergeordnete Funktionalität |
| --- | --- |
| `server/index.ts` | Express-Setup (CORS, Body Parsing, Logging), Expo-Manifest/Static-Serving, Server-Boot. |
| `server/routes.ts` | API-Routen-Registry (aktuell Platzhalter, Basis für spätere Endpoints). |
| `server/storage.ts` | In-Memory Storage für User; CRUD-Interface an Schema gebunden. |
| `server/templates/landing-page.html` | Landing-Page Template für Expo Go/Static Deploy. |

## Shared & Datenmodell

| Pfad | Übergeordnete Funktionalität |
| --- | --- |
| `shared/schema.ts` | Datenmodell (users) via Drizzle + Zod; Typen für Server/Storage. |
| `drizzle.config.ts` | DB/ORM-Konfiguration (Drizzle). |

## Build & Konfiguration

| Pfad | Übergeordnete Funktionalität |
| --- | --- |
| `scripts/build.js` | Statischer Expo-Build (Bundles/Manifeste/Assets) + Deployment-Prep. |
| `app.json` | Expo App-Konfiguration (Name, Icons, Plugins, Plattform-Settings). |
| `babel.config.js` | Babel-Konfiguration für Metro/Expo. |
| `tsconfig.json` | TypeScript-Compiler-Konfiguration. |
| `package.json` | Scripts für Dev/Build/Lint; Einstiegspunkte für CLI-Workflows. |

## Assets & Design

| Pfad | Übergeordnete Funktionalität |
| --- | --- |
| `assets/` | App-Assets (Icons, Splash, Bilder) im Runtime-Delivery. |
| `design_guidelines.md` | Design/UX-Leitplanken als Referenz. |
| `attached_assets/` | Design- und Wireframe-Artefakte (nicht Teil der Runtime). |
