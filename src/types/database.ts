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
      anime: {
        Row: {
          anilist_id: number
          average_score: number | null
          banner_image_url: string | null
          country_of_origin: string | null
          cover_image_url: string | null
          description: string | null
          duration_minutes: number | null
          end_date: Json | null
          english_title: string | null
          episodes: number | null
          external_links: Json | null
          favourites: number | null
          format: string | null
          genres: string[]
          hashtag: string | null
          id: string
          mean_score: number | null
          metadata_updated_at: string
          native_title: string | null
          popularity: number | null
          rankings: Json | null
          romaji_title: string
          season: string | null
          season_year: number | null
          site_url: string | null
          source: string | null
          start_date: Json | null
          status: string | null
          studios: Json | null
          tags: Json | null
          trailer: Json | null
          trending: number | null
        }
        Insert: {
          anilist_id: number
          average_score?: number | null
          banner_image_url?: string | null
          country_of_origin?: string | null
          cover_image_url?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: Json | null
          english_title?: string | null
          episodes?: number | null
          external_links?: Json | null
          favourites?: number | null
          format?: string | null
          genres?: string[]
          hashtag?: string | null
          id?: string
          mean_score?: number | null
          metadata_updated_at?: string
          native_title?: string | null
          popularity?: number | null
          rankings?: Json | null
          romaji_title: string
          season?: string | null
          season_year?: number | null
          site_url?: string | null
          source?: string | null
          start_date?: Json | null
          status?: string | null
          studios?: Json | null
          tags?: Json | null
          trailer?: Json | null
          trending?: number | null
        }
        Update: {
          anilist_id?: number
          average_score?: number | null
          banner_image_url?: string | null
          country_of_origin?: string | null
          cover_image_url?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: Json | null
          english_title?: string | null
          episodes?: number | null
          external_links?: Json | null
          favourites?: number | null
          format?: string | null
          genres?: string[]
          hashtag?: string | null
          id?: string
          mean_score?: number | null
          metadata_updated_at?: string
          native_title?: string | null
          popularity?: number | null
          rankings?: Json | null
          romaji_title?: string
          season?: string | null
          season_year?: number | null
          site_url?: string | null
          source?: string | null
          start_date?: Json | null
          status?: string | null
          studios?: Json | null
          tags?: Json | null
          trailer?: Json | null
          trending?: number | null
        }
        Relationships: []
      }
      anime_embeddings: {
        Row: {
          anime_id: string
          embedding: string
          embedding_model: string
          metadata_hash: string
          metadata_text: string
          updated_at: string
        }
        Insert: {
          anime_id: string
          embedding: string | number[]
          embedding_model: string
          metadata_hash: string
          metadata_text: string
          updated_at?: string
        }
        Update: {
          anime_id?: string
          embedding?: string | number[]
          embedding_model?: string
          metadata_hash?: string
          metadata_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_embeddings_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: true
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      anime_import_jobs: {
        Row: {
          backfill_anime_ids: string[]
          created_at: string
          error: string | null
          heartbeat_at: string | null
          id: string
          imported: number
          matched: number
          needs_review_count: number
          processed: number
          retry_count: number
          skipped: number
          source: Database["public"]["Enums"]["import_source"]
          source_input: Json
          staged_rows: Json
          status: Database["public"]["Enums"]["import_status"]
          total: number
          unmatched: number
          updated_at: string
          user_id: string
        }
        Insert: {
          backfill_anime_ids?: string[]
          created_at?: string
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          imported?: number
          matched?: number
          needs_review_count?: number
          processed?: number
          retry_count?: number
          skipped?: number
          source: Database["public"]["Enums"]["import_source"]
          source_input?: Json
          staged_rows?: Json
          status?: Database["public"]["Enums"]["import_status"]
          total?: number
          unmatched?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          backfill_anime_ids?: string[]
          created_at?: string
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          imported?: number
          matched?: number
          needs_review_count?: number
          processed?: number
          retry_count?: number
          skipped?: number
          source?: Database["public"]["Enums"]["import_source"]
          source_input?: Json
          staged_rows?: Json
          status?: Database["public"]["Enums"]["import_status"]
          total?: number
          unmatched?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anime_recommendations: {
        Row: {
          anime_id: string
          created_at: string
          id: string
          note: string | null
          recipient_id: string
          responded_at: string | null
          seen_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["friend_recommendation_status"]
        }
        Insert: {
          anime_id: string
          created_at?: string
          id?: string
          note?: string | null
          recipient_id: string
          responded_at?: string | null
          seen_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["friend_recommendation_status"]
        }
        Update: {
          anime_id?: string
          created_at?: string
          id?: string
          note?: string | null
          recipient_id?: string
          responded_at?: string | null
          seen_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_recommendation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "anime_recommendations_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      anime_series_map: {
        Row: {
          anime_id: string
          confidence: number
          created_at: string
          series_id: string
          source: Database["public"]["Enums"]["series_map_source"]
        }
        Insert: {
          anime_id: string
          confidence?: number
          created_at?: string
          series_id: string
          source?: Database["public"]["Enums"]["series_map_source"]
        }
        Update: {
          anime_id?: string
          confidence?: number
          created_at?: string
          series_id?: string
          source?: Database["public"]["Enums"]["series_map_source"]
        }
        Relationships: [
          {
            foreignKeyName: "anime_series_map_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: true
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_series_map_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      derived_series_rankings: {
        Row: {
          algorithm_version: string
          comparison_count: number
          computed_at: string
          confidence: Database["public"]["Enums"]["ranking_confidence"]
          id: string
          rank: number
          score: number
          series_id: string
          uncertainty: number | null
          user_id: string
        }
        Insert: {
          algorithm_version?: string
          comparison_count?: number
          computed_at?: string
          confidence?: Database["public"]["Enums"]["ranking_confidence"]
          id?: string
          rank: number
          score: number
          series_id: string
          uncertainty?: number | null
          user_id: string
        }
        Update: {
          algorithm_version?: string
          comparison_count?: number
          computed_at?: string
          confidence?: Database["public"]["Enums"]["ranking_confidence"]
          id?: string
          rank?: number
          score?: number
          series_id?: string
          uncertainty?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "derived_series_rankings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["friendship_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: []
      }
      pairwise_series_comparisons: {
        Row: {
          comparison_context: Json | null
          created_at: string
          id: string
          left_series_id: string
          right_series_id: string
          skipped_reason: string | null
          user_id: string
          winner_series_id: string | null
        }
        Insert: {
          comparison_context?: Json | null
          created_at?: string
          id?: string
          left_series_id: string
          right_series_id: string
          skipped_reason?: string | null
          user_id: string
          winner_series_id?: string | null
        }
        Update: {
          comparison_context?: Json | null
          created_at?: string
          id?: string
          left_series_id?: string
          right_series_id?: string
          skipped_reason?: string | null
          user_id?: string
          winner_series_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairwise_series_comparisons_left_series_id_fkey"
            columns: ["left_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairwise_series_comparisons_right_series_id_fkey"
            columns: ["right_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairwise_series_comparisons_winner_series_id_fkey"
            columns: ["winner_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          show_activity_to_friends: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          show_activity_to_friends?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          show_activity_to_friends?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      recommendation_runs: {
        Row: {
          algorithm_version: string
          collaboration_mode: string | null
          collaborator_user_id: string | null
          created_at: string
          embedding_model: string
          friendship_id: string | null
          id: string
          input_hash: string
          request_prefs: Json | null
          run_kind: string
          sampling_seed: string | null
          user_id: string
        }
        Insert: {
          algorithm_version: string
          collaboration_mode?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          embedding_model: string
          friendship_id?: string | null
          id?: string
          input_hash: string
          request_prefs?: Json | null
          run_kind?: string
          sampling_seed?: string | null
          user_id: string
        }
        Update: {
          algorithm_version?: string
          collaboration_mode?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          embedding_model?: string
          friendship_id?: string | null
          id?: string
          input_hash?: string
          request_prefs?: Json | null
          run_kind?: string
          sampling_seed?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_runs_friendship_id_fkey"
            columns: ["friendship_id"]
            isOneToOne: false
            referencedRelation: "friendships"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          algorithm_version: string
          anime_id: string
          created_at: string
          explanation: string
          explanation_details: Json
          final_score: number
          id: string
          position: number
          reason_codes: string[]
          rerank_score: number
          run_id: string
          series_id: string | null
          similarity_score: number
          user_id: string
        }
        Insert: {
          algorithm_version: string
          anime_id: string
          created_at?: string
          explanation: string
          explanation_details?: Json
          final_score: number
          id?: string
          position: number
          reason_codes?: string[]
          rerank_score: number
          run_id: string
          series_id?: string | null
          similarity_score: number
          user_id: string
        }
        Update: {
          algorithm_version?: string
          anime_id?: string
          created_at?: string
          explanation?: string
          explanation_details?: Json
          final_score?: number
          id?: string
          position?: number
          reason_codes?: string[]
          rerank_score?: number
          run_id?: string
          series_id?: string | null
          similarity_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "recommendation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          anilist_primary_id: number
          canonical_title: string
          cover_image_url: string | null
          created_at: string
          id: string
          slug: string
          updated_at: string
        }
        Insert: {
          anilist_primary_id: number
          canonical_title: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          anilist_primary_id?: number
          canonical_title?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_group_overrides: {
        Row: {
          action: Database["public"]["Enums"]["series_override_action"]
          anilist_id: number
          created_at: string
          id: string
          notes: string | null
          target_anilist_primary_id: number | null
          target_series_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["series_override_action"]
          anilist_id: number
          created_at?: string
          id?: string
          notes?: string | null
          target_anilist_primary_id?: number | null
          target_series_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["series_override_action"]
          anilist_id?: number
          created_at?: string
          id?: string
          notes?: string | null
          target_anilist_primary_id?: number | null
          target_series_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_group_overrides_target_series_id_fkey"
            columns: ["target_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_anime_entries: {
        Row: {
          anime_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          personal_score: number | null
          priority: Database["public"]["Enums"]["watchlist_priority"] | null
          progress_episodes: number
          rewatch_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["anime_entry_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          personal_score?: number | null
          priority?: Database["public"]["Enums"]["watchlist_priority"] | null
          progress_episodes?: number
          rewatch_count?: number
          started_at?: string | null
          status: Database["public"]["Enums"]["anime_entry_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          personal_score?: number | null
          priority?: Database["public"]["Enums"]["watchlist_priority"] | null
          progress_episodes?: number
          rewatch_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["anime_entry_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_anime_entries_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          anime_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          anime_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          anime_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      user_taste_profiles: {
        Row: {
          algorithm_version: string
          embedding: string
          embedding_model: string
          input_hash: string
          profile_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm_version: string
          embedding: string | number[]
          embedding_model: string
          input_hash: string
          profile_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm_version?: string
          embedding?: string | number[]
          embedding_model?: string
          input_hash?: string
          profile_text?: string
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
      match_anime_embeddings: {
        Args: {
          excluded_anime_ids?: string[]
          excluded_series_ids?: string[]
          match_count?: number
          query_embedding: string | number[]
        }
        Returns: {
          anime_id: string
          similarity: number
        }[]
      }
      replace_user_series_rankings: {
        Args: { p_algorithm_version: string; p_rows: Json; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      anime_entry_status:
        | "watching"
        | "completed"
        | "paused"
        | "dropped"
        | "plan_to_watch"
      friend_recommendation_status: "pending" | "added" | "dismissed"
      friendship_status: "pending" | "accepted" | "declined" | "blocked"
      import_source: "anilist" | "mal_xml" | "plain_text"
      import_status:
        | "pending"
        | "parsing"
        | "needs_review"
        | "importing"
        | "series_backfill"
        | "done"
        | "failed"
        | "canceled"
      profile_visibility: "public" | "friends_only" | "private"
      ranking_confidence: "low" | "medium" | "high"
      series_map_source: "anilist_auto" | "manual_override" | "singleton"
      series_override_action:
        | "force_series"
        | "force_singleton"
        | "exclude_from_auto_group"
      watchlist_priority: "low" | "medium" | "high"
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
      anime_entry_status: [
        "watching",
        "completed",
        "paused",
        "dropped",
        "plan_to_watch",
      ],
      friend_recommendation_status: ["pending", "added", "dismissed"],
      friendship_status: ["pending", "accepted", "declined", "blocked"],
      import_source: ["anilist", "mal_xml", "plain_text"],
      import_status: [
        "pending",
        "parsing",
        "needs_review",
        "importing",
        "series_backfill",
        "done",
        "failed",
        "canceled",
      ],
      profile_visibility: ["public", "friends_only", "private"],
      ranking_confidence: ["low", "medium", "high"],
      series_map_source: ["anilist_auto", "manual_override", "singleton"],
      series_override_action: [
        "force_series",
        "force_singleton",
        "exclude_from_auto_group",
      ],
      watchlist_priority: ["low", "medium", "high"],
    },
  },
} as const
