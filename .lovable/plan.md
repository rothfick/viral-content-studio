# System produkcji viral content + dashboard zarządzania

Pełny system end-to-end: workflow w n8n generuje treści (research trendów → skrypt AI → lektor TTS → wideo → publikacja), a dashboard w Lovable jest centrum kontroli z Kanbanem, kalendarzem i statystykami.

## Architektura

Rekomendowane podejście: **dwukierunkowa synchronizacja przez Lovable Cloud (Supabase) jako wspólną bazę**.

```text
┌─────────────┐    webhooks     ┌──────────────┐
│  Dashboard  │ ──────────────▶ │     n8n      │
│  (Lovable)  │                 │  (workflow)  │
│             │ ◀────────────── │              │
└──────┬──────┘   REST/insert   └──────┬───────┘
       │                               │
       └────────► Supabase ◀───────────┘
                (single source of truth)
```

Dlaczego: n8n potrzebuje miejsca na zapis statusów/wyników, a dashboard musi wyzwalać akcje (np. „wygeneruj teraz", „opublikuj"). Wspólna baza eliminuje duplikację stanu, a webhooki dają natychmiastowy trigger z UI.

## Dashboard (Lovable)

### Strony

1. **Kanban tablica treści** (`/`) — kolumny: Pomysł → Skrypt → Produkcja → Gotowe → Opublikowane → Archiwum. Drag & drop kart między kolumnami. Karta pokazuje: thumbnail, tytuł, hook, platformy docelowe, status produkcji, planowaną datę.
2. **Kalendarz publikacji** (`/calendar`) — widok miesięczny/tygodniowy, kafelki treści w slotach czasowych, drag & drop do przeplanowania, filtrowanie po platformie (TikTok / Reels / Shorts).
3. **Szczegóły treści** (`/content/:id`) — edycja skryptu, hooka, hashtagów, podgląd wygenerowanego wideo, wybór platform, harmonogram publikacji, ręczne triggery („regeneruj skrypt", „regeneruj głos", „opublikuj teraz").
4. **Statystyki** (`/analytics`) — wykresy views/likes/comments/shares per platforma, top performing content, trendy w czasie, porównanie platform, ROI hooków.
5. **Trendy & pomysły** (`/trends`) — lista trendujących tematów z n8n research, jeden klik tworzy nowy draft.
6. **Ustawienia** (`/settings`) — konfiguracja webhooków n8n, klucze do platform, presety voice/styl, brand voice.

### Komponenty wizualne

- Ciemny motyw z akcentem (np. fiolet/cyan) w stylu nowoczesnych narzędzi creatorów (CapCut/Submagic vibe)
- Karty z thumbnailami w pionowej proporcji 9:16
- Status badges z kolorami per etap
- Real-time updates (Supabase Realtime) — gdy n8n zmieni status, karta aktualizuje się od razu

## Workflow n8n (do wdrożenia po Twojej stronie n8n)

System przygotuje webhooki i schemat danych. Dashboard dostarczy n8n-owi:

- **Webhook „content.create"** — POST z pomysłem/tematem, n8n przejmuje
- **Webhook „content.regenerate"** — regeneracja konkretnego etapu (script/voice/video)
- **Webhook „content.publish"** — publikacja na wybranych platformach
- **REST endpoint** w dashboardzie do zapisu rezultatów (alternatywnie n8n pisze bezpośrednio do Supabase przez node Postgres)

Sugerowana struktura workflow n8n (dokumentacja w README):

```text
[Trigger: webhook lub cron]
  → [Research: trending topics z TikTok/YouTube API/Perplexity]
  → [LLM: skrypt + hook + CTA + hashtagi]
  → [Update DB: status=skrypt_gotowy]
  → [TTS: ElevenLabs/OpenAI voice]
  → [Generator wideo: Creatomate/JSON2Video/Shotstack]
  → [Update DB: status=gotowe + URL wideo]
  → [Scheduler / Publish: TikTok API, Instagram Graph API, YouTube Data API]
  → [Update DB: status=opublikowane + post IDs]
  → [Cron co X godzin: pobierz statystyki → zapis do DB]
```

## Model danych (Lovable Cloud)

- `content_items` — id, title, idea, hook, script, hashtags[], voice_url, video_url, thumbnail_url, status, scheduled_at, created_at
- `content_platforms` — content_id, platform (tiktok/reels/shorts), post_id, post_url, published_at, status
- `analytics` — content_id, platform, views, likes, comments, shares, fetched_at
- `trending_topics` — topic, platform, score, source, discovered_at
- `settings` — n8n_webhook_urls (jsonb), brand_voice, default_voice_id

RLS: każdy użytkownik widzi tylko swoje treści (auth wymagany).

## Etapy realizacji

1. **Setup bazy + auth** — Lovable Cloud, tabele, RLS, logowanie email
2. **Kanban** — lista treści, drag & drop statusów, modal tworzenia drafta
3. **Strona szczegółów** — edycja pól, podgląd wideo, przyciski triggerów webhooków n8n
4. **Kalendarz publikacji** — widok miesięczny + drag & drop scheduler
5. **Trendy & pomysły** — lista z `trending_topics`, „utwórz draft"
6. **Statystyki** — wykresy (recharts) z agregacji `analytics`
7. **Ustawienia** — konfiguracja URL-i webhooków n8n + kluczy
8. **Realtime** — subskrypcja zmian z Supabase, żywe aktualizacje kart
9. **Dokumentacja n8n** — README z gotowym schematem workflow + przykładowymi payloadami webhooków

## Szczegóły techniczne

- **Stack**: React + Vite + Tailwind + shadcn/ui, Lovable Cloud (Supabase) jako backend
- **Drag & drop**: `@dnd-kit/core` dla Kanbana i kalendarza
- **Wykresy**: `recharts`
- **Kalendarz**: własna siatka miesięczna oparta na `date-fns` (pełna kontrola nad slotami publikacji)
- **Realtime**: Supabase Realtime na `content_items` i `analytics`
- **Webhooki**: edge function `trigger-n8n` waliduje request i forwarduje do n8n (URL z `settings`), żeby trzymać sekrety po stronie serwera
- **Klucze platform** (TikTok/IG/YT) — zarządzane po stronie n8n, nie w dashboardzie

## Co NIE jest częścią tej iteracji

- Sam workflow n8n (dostarczę dokumentację + payloady, fizyczne nody konfigurujesz w n8n)
- Bezpośrednia integracja z TikTok/IG/YT API w dashboardzie (robi to n8n)
- Generator wideo w przeglądarce (n8n używa Creatomate/podobnego)

Po akceptacji zaczynam od bazy, auth i Kanbana, potem iteracyjnie dokładam pozostałe widoki.