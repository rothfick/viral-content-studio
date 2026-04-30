
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Status enum
CREATE TYPE public.content_status AS ENUM ('idea', 'script', 'production', 'ready', 'published', 'archived');
CREATE TYPE public.platform_type AS ENUM ('tiktok', 'reels', 'shorts');

-- Content items
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  idea TEXT,
  hook TEXT,
  script TEXT,
  hashtags TEXT[] DEFAULT '{}',
  voice_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  status public.content_status NOT NULL DEFAULT 'idea',
  scheduled_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content owner select" ON public.content_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Content owner insert" ON public.content_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Content owner update" ON public.content_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Content owner delete" ON public.content_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX content_items_user_status_idx ON public.content_items(user_id, status);
CREATE INDEX content_items_scheduled_idx ON public.content_items(user_id, scheduled_at);

-- Content platforms
CREATE TABLE public.content_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL,
  post_id TEXT,
  post_url TEXT,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, platform)
);
ALTER TABLE public.content_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platforms owner select" ON public.content_platforms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Platforms owner insert" ON public.content_platforms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Platforms owner update" ON public.content_platforms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Platforms owner delete" ON public.content_platforms FOR DELETE USING (auth.uid() = user_id);

-- Analytics
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics owner select" ON public.analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Analytics owner insert" ON public.analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX analytics_content_idx ON public.analytics(content_id, fetched_at DESC);

-- Trending topics
CREATE TABLE public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT,
  platform public.platform_type,
  score NUMERIC,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trends authenticated read" ON public.trending_topics FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Trends owner insert" ON public.trending_topics FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Trends owner update" ON public.trending_topics FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  n8n_webhook_create TEXT,
  n8n_webhook_regenerate TEXT,
  n8n_webhook_publish TEXT,
  brand_voice TEXT,
  default_voice_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings owner select" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Settings owner insert" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Settings owner update" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER content_items_updated_at BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile + settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER TABLE public.content_items REPLICA IDENTITY FULL;
ALTER TABLE public.content_platforms REPLICA IDENTITY FULL;
ALTER TABLE public.analytics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_platforms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics;
