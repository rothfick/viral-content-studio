export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          comments: number
          content_id: string
          fetched_at: string
          id: string
          likes: number
          platform: Database["public"]["Enums"]["platform_type"]
          shares: number
          user_id: string
          views: number
        }
        Insert: {
          comments?: number
          content_id: string
          fetched_at?: string
          id?: string
          likes?: number
          platform: Database["public"]["Enums"]["platform_type"]
          shares?: number
          user_id: string
          views?: number
        }
        Update: {
          comments?: number
          content_id?: string
          fetched_at?: string
          id?: string
          likes?: number
          platform?: Database["public"]["Enums"]["platform_type"]
          shares?: number
          user_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string
          hashtags: string[] | null
          hook: string | null
          id: string
          idea: string | null
          metadata: Json | null
          position: number
          scheduled_at: string | null
          script: string | null
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          voice_url: string | null
        }
        Insert: {
          created_at?: string
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          idea?: string | null
          metadata?: Json | null
          position?: number
          scheduled_at?: string | null
          script?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          voice_url?: string | null
        }
        Update: {
          created_at?: string
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          idea?: string | null
          metadata?: Json | null
          position?: number
          scheduled_at?: string | null
          script?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          voice_url?: string | null
        }
        Relationships: []
      }
      content_platforms: {
        Row: {
          content_id: string
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string | null
          post_url: string | null
          published_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          platform: Database["public"]["Enums"]["platform_type"]
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_platforms_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          description: string | null
          discovered_at: string
          id: string
          metadata: Json | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          score: number | null
          source: string | null
          topic: string
          used: boolean
          user_id: string | null
        }
        Insert: {
          description?: string | null
          discovered_at?: string
          id?: string
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          score?: number | null
          source?: string | null
          topic: string
          used?: boolean
          user_id?: string | null
        }
        Update: {
          description?: string | null
          discovered_at?: string
          id?: string
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          score?: number | null
          source?: string | null
          topic?: string
          used?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          brand_voice: string | null
          default_voice_id: string | null
          metadata: Json | null
          n8n_webhook_create: string | null
          n8n_webhook_publish: string | null
          n8n_webhook_regenerate: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_voice?: string | null
          default_voice_id?: string | null
          metadata?: Json | null
          n8n_webhook_create?: string | null
          n8n_webhook_publish?: string | null
          n8n_webhook_regenerate?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_voice?: string | null
          default_voice_id?: string | null
          metadata?: Json | null
          n8n_webhook_create?: string | null
          n8n_webhook_publish?: string | null
          n8n_webhook_regenerate?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_status:
        | "idea"
        | "script"
        | "production"
        | "ready"
        | "published"
        | "archived"
      platform_type: "tiktok" | "reels" | "shorts"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: [
        "idea",
        "script",
        "production",
        "ready",
        "published",
        "archived",
      ],
      platform_type: ["tiktok", "reels", "shorts"],
    },
  },
} as const
