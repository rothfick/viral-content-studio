export const STATUS_COLUMNS = [
  { id: "idea", label: "Pomysł", color: "status-idea" },
  { id: "script", label: "Skrypt", color: "status-script" },
  { id: "production", label: "Produkcja", color: "status-production" },
  { id: "ready", label: "Gotowe", color: "status-ready" },
  { id: "published", label: "Opublikowane", color: "status-published" },
  { id: "archived", label: "Archiwum", color: "status-archived" },
] as const;

export type ContentStatus = typeof STATUS_COLUMNS[number]["id"];

export const PLATFORMS = [
  { id: "tiktok", label: "TikTok", color: "platform-tiktok" },
  { id: "reels", label: "Reels", color: "platform-reels" },
  { id: "shorts", label: "Shorts", color: "platform-shorts" },
] as const;

export type Platform = typeof PLATFORMS[number]["id"];
