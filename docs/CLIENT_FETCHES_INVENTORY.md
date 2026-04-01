# Security-Relevant Client Access Inventory

Stand: 2026-03-31

## Status

Nach Critical- und Medium-Overhaul gibt es im produktiven Client keine direkten Supabase-Tabellenzugriffe mehr auf die sicherheitsrelevanten Domain-Tabellen:

- `users`
- `user_onboarding`
- `user_financial_profiles`
- `income_sources`
- `fixed_expenses`
- `goals`
- `goal_contributions`
- `budgets`
- `transactions`
- `vault_transactions`
- `monthly_balance_snapshots`
- `levels`
- `user_progress`
- `xp_events`
- `xp_event_types`
- `xp_event_rules`

Diese Pfade laufen jetzt serverseitig über RPCs.

## Verbleibende direkte Client-Reads

| Datei                                         | Funktion                 | Zugriff                     | Bewertung                    | Grund                                                                                     |
| --------------------------------------------- | ------------------------ | --------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `client/services/billing-products-service.ts` | `fetchBillingProducts()` | `.from("billing_products")` | niedrig / bewusst akzeptiert | read-only Produktkatalog, keine Secrets, keine nutzerspezifischen Finanz- oder Auth-Daten |

## Verbleibende relevante lokale Speicherpfade

| Datei                               | Thema                   | Bewertung | Status                                                                                    |
| ----------------------------------- | ----------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `client/lib/supabase.ts`            | Session-Persistenz      | gehärtet  | native Tokens in `SecureStore` mit Chunking; kein nativer Fallback mehr in `AsyncStorage` |
| `client/services/local-storage.ts`  | `pending_workshop_code` | gehärtet  | auf nativen Clients in `SecureStore`, `AsyncStorage` nur Web/Fallback                     |
| `client/context/AppContext.tsx`     | App-Fallback-Persistenz | gehärtet  | nur noch nicht-sensitive Minimalwerte                                                     |
| `client/stores/onboarding-store.ts` | Onboarding-Persistenz   | gehärtet  | sensible Finanzentwürfe entfernt                                                          |

## Kurzfazit

Der sicherheitsrelevante Client-Datenzugriff ist aktuell auf RPC-basierte Serverpfade reduziert. Der einzige verbliebene direkte Tabellen-Read im Client ist `billing_products` als unkritischer Produktkatalog-Read.
