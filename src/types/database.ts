export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      anime: {
        Row: {
          anilist_id: number;
          average_score: number | null;
          banner_image_url: string | null;
          cover_image_url: string | null;
          description: string | null;
          duration_minutes: number | null;
          english_title: string | null;
          episodes: number | null;
          format: string | null;
          genres: string[];
          id: string;
          metadata_updated_at: string;
          native_title: string | null;
          popularity: number | null;
          romaji_title: string;
          season: string | null;
          season_year: number | null;
          source: string | null;
          status: string | null;
        };
        Insert: {
          anilist_id: number;
          average_score?: number | null;
          banner_image_url?: string | null;
          cover_image_url?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          english_title?: string | null;
          episodes?: number | null;
          format?: string | null;
          genres?: string[];
          id?: string;
          metadata_updated_at?: string;
          native_title?: string | null;
          popularity?: number | null;
          romaji_title: string;
          season?: string | null;
          season_year?: number | null;
          source?: string | null;
          status?: string | null;
        };
        Update: {
          anilist_id?: number;
          average_score?: number | null;
          banner_image_url?: string | null;
          cover_image_url?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          english_title?: string | null;
          episodes?: number | null;
          format?: string | null;
          genres?: string[];
          id?: string;
          metadata_updated_at?: string;
          native_title?: string | null;
          popularity?: number | null;
          romaji_title?: string;
          season?: string | null;
          season_year?: number | null;
          source?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      anime_embeddings: {
        Row: {
          anime_id: string;
          embedding: string;
          embedding_model: string;
          metadata_hash: string;
          metadata_text: string;
          updated_at: string;
        };
        Insert: {
          anime_id: string;
          embedding: string | number[];
          embedding_model: string;
          metadata_hash: string;
          metadata_text: string;
          updated_at?: string;
        };
        Update: {
          anime_id?: string;
          embedding?: string | number[];
          embedding_model?: string;
          metadata_hash?: string;
          metadata_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anime_embeddings_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: true;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
        ];
      };
      anime_series_map: {
        Row: {
          anime_id: string;
          confidence: number;
          created_at: string;
          series_id: string;
          source: Database["public"]["Enums"]["series_map_source"];
        };
        Insert: {
          anime_id: string;
          confidence?: number;
          created_at?: string;
          series_id: string;
          source?: Database["public"]["Enums"]["series_map_source"];
        };
        Update: {
          anime_id?: string;
          confidence?: number;
          created_at?: string;
          series_id?: string;
          source?: Database["public"]["Enums"]["series_map_source"];
        };
        Relationships: [
          {
            foreignKeyName: "anime_series_map_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: true;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "anime_series_map_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      derived_rankings: {
        Row: {
          algorithm_version: string;
          anime_id: string;
          comparison_count: number;
          computed_at: string;
          confidence: Database["public"]["Enums"]["ranking_confidence"];
          id: string;
          rank: number;
          score: number;
          user_id: string;
        };
        Insert: {
          algorithm_version?: string;
          anime_id: string;
          comparison_count?: number;
          computed_at?: string;
          confidence?: Database["public"]["Enums"]["ranking_confidence"];
          id?: string;
          rank: number;
          score: number;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          anime_id?: string;
          comparison_count?: number;
          computed_at?: string;
          confidence?: Database["public"]["Enums"]["ranking_confidence"];
          id?: string;
          rank?: number;
          score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "derived_rankings_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
        ];
      };
      derived_series_rankings: {
        Row: {
          algorithm_version: string;
          comparison_count: number;
          computed_at: string;
          confidence: Database["public"]["Enums"]["ranking_confidence"];
          id: string;
          rank: number;
          score: number;
          series_id: string;
          user_id: string;
        };
        Insert: {
          algorithm_version?: string;
          comparison_count?: number;
          computed_at?: string;
          confidence?: Database["public"]["Enums"]["ranking_confidence"];
          id?: string;
          rank: number;
          score: number;
          series_id: string;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          comparison_count?: number;
          computed_at?: string;
          confidence?: Database["public"]["Enums"]["ranking_confidence"];
          id?: string;
          rank?: number;
          score?: number;
          series_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "derived_series_rankings_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendation_runs: {
        Row: {
          algorithm_version: string;
          collaboration_mode: string | null;
          collaborator_user_id: string | null;
          created_at: string;
          embedding_model: string;
          friendship_id: string | null;
          id: string;
          input_hash: string;
          request_prefs: Json | null;
          run_kind: string;
          sampling_seed: string | null;
          user_id: string;
        };
        Insert: {
          algorithm_version: string;
          collaboration_mode?: string | null;
          collaborator_user_id?: string | null;
          created_at?: string;
          embedding_model: string;
          friendship_id?: string | null;
          id?: string;
          input_hash: string;
          request_prefs?: Json | null;
          run_kind?: string;
          sampling_seed?: string | null;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          collaboration_mode?: string | null;
          collaborator_user_id?: string | null;
          created_at?: string;
          embedding_model?: string;
          friendship_id?: string | null;
          id?: string;
          input_hash?: string;
          request_prefs?: Json | null;
          run_kind?: string;
          sampling_seed?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendation_runs_collaborator_user_id_fkey";
            columns: ["collaborator_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendation_runs_friendship_id_fkey";
            columns: ["friendship_id"];
            isOneToOne: false;
            referencedRelation: "friendships";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendations: {
        Row: {
          algorithm_version: string;
          anime_id: string;
          created_at: string;
          explanation: string;
          explanation_details: Json;
          final_score: number;
          id: string;
          reason_codes: string[];
          rerank_score: number;
          run_id: string;
          series_id: string | null;
          similarity_score: number;
          user_id: string;
        };
        Insert: {
          algorithm_version: string;
          anime_id: string;
          created_at?: string;
          explanation: string;
          explanation_details?: Json;
          final_score: number;
          id?: string;
          reason_codes?: string[];
          rerank_score: number;
          run_id: string;
          series_id?: string | null;
          similarity_score: number;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          anime_id?: string;
          created_at?: string;
          explanation?: string;
          explanation_details?: Json;
          final_score?: number;
          id?: string;
          reason_codes?: string[];
          rerank_score?: number;
          run_id?: string;
          series_id?: string | null;
          similarity_score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendations_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendations_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "recommendation_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendations_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          id: string;
          recipient_id: string;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["friendship_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          recipient_id: string;
          requester_id: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friendship_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          recipient_id?: string;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["friendship_status"];
        };
        Relationships: [];
      };
      pairwise_comparisons: {
        Row: {
          comparison_context: Json | null;
          created_at: string;
          id: string;
          left_anime_id: string;
          right_anime_id: string;
          skipped_reason: string | null;
          user_id: string;
          winner_anime_id: string | null;
        };
        Insert: {
          comparison_context?: Json | null;
          created_at?: string;
          id?: string;
          left_anime_id: string;
          right_anime_id: string;
          skipped_reason?: string | null;
          user_id: string;
          winner_anime_id?: string | null;
        };
        Update: {
          comparison_context?: Json | null;
          created_at?: string;
          id?: string;
          left_anime_id?: string;
          right_anime_id?: string;
          skipped_reason?: string | null;
          user_id?: string;
          winner_anime_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pairwise_comparisons_left_anime_id_fkey";
            columns: ["left_anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pairwise_comparisons_right_anime_id_fkey";
            columns: ["right_anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pairwise_comparisons_winner_anime_id_fkey";
            columns: ["winner_anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
        ];
      };
      pairwise_series_comparisons: {
        Row: {
          comparison_context: Json | null;
          created_at: string;
          id: string;
          left_series_id: string;
          right_series_id: string;
          skipped_reason: string | null;
          user_id: string;
          winner_series_id: string | null;
        };
        Insert: {
          comparison_context?: Json | null;
          created_at?: string;
          id?: string;
          left_series_id: string;
          right_series_id: string;
          skipped_reason?: string | null;
          user_id: string;
          winner_series_id?: string | null;
        };
        Update: {
          comparison_context?: Json | null;
          created_at?: string;
          id?: string;
          left_series_id?: string;
          right_series_id?: string;
          skipped_reason?: string | null;
          user_id?: string;
          winner_series_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pairwise_series_comparisons_left_series_id_fkey";
            columns: ["left_series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pairwise_series_comparisons_right_series_id_fkey";
            columns: ["right_series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pairwise_series_comparisons_winner_series_id_fkey";
            columns: ["winner_series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          profile_visibility: Database["public"]["Enums"]["profile_visibility"];
          updated_at: string;
          user_id: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"];
          updated_at?: string;
          user_id: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"];
          updated_at?: string;
          user_id?: string;
          username?: string;
        };
        Relationships: [];
      };
      series: {
        Row: {
          anilist_primary_id: number;
          canonical_title: string;
          cover_image_url: string | null;
          created_at: string;
          id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          anilist_primary_id: number;
          canonical_title: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          anilist_primary_id?: number;
          canonical_title?: string;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      series_group_overrides: {
        Row: {
          action: Database["public"]["Enums"]["series_override_action"];
          anilist_id: number;
          created_at: string;
          id: string;
          notes: string | null;
          target_anilist_primary_id: number | null;
          target_series_id: string | null;
        };
        Insert: {
          action: Database["public"]["Enums"]["series_override_action"];
          anilist_id: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          target_anilist_primary_id?: number | null;
          target_series_id?: string | null;
        };
        Update: {
          action?: Database["public"]["Enums"]["series_override_action"];
          anilist_id?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          target_anilist_primary_id?: number | null;
          target_series_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "series_group_overrides_target_series_id_fkey";
            columns: ["target_series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      user_anime_entries: {
        Row: {
          anime_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          personal_score: number | null;
          priority: Database["public"]["Enums"]["watchlist_priority"] | null;
          progress_episodes: number;
          rewatch_count: number;
          started_at: string | null;
          status: Database["public"]["Enums"]["anime_entry_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          anime_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          personal_score?: number | null;
          priority?: Database["public"]["Enums"]["watchlist_priority"] | null;
          progress_episodes?: number;
          rewatch_count?: number;
          started_at?: string | null;
          status: Database["public"]["Enums"]["anime_entry_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          anime_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          personal_score?: number | null;
          priority?: Database["public"]["Enums"]["watchlist_priority"] | null;
          progress_episodes?: number;
          rewatch_count?: number;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["anime_entry_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_anime_entries_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
        ];
      };
      user_taste_profiles: {
        Row: {
          algorithm_version: string;
          embedding: string;
          embedding_model: string;
          input_hash: string;
          profile_text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          algorithm_version: string;
          embedding: string | number[];
          embedding_model: string;
          input_hash: string;
          profile_text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          algorithm_version?: string;
          embedding?: string | number[];
          embedding_model?: string;
          input_hash?: string;
          profile_text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_events: {
        Row: {
          anime_id: string | null;
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json;
          user_id: string;
        };
        Insert: {
          anime_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          user_id: string;
        };
        Update: {
          anime_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_events_anime_id_fkey";
            columns: ["anime_id"];
            isOneToOne: false;
            referencedRelation: "anime";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_anime_embeddings: {
        Args: {
          excluded_anime_ids?: string[];
          excluded_series_ids?: string[];
          match_count?: number;
          query_embedding: string | number[];
        };
        Returns: {
          anime_id: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      anime_entry_status:
        | "watching"
        | "completed"
        | "paused"
        | "dropped"
        | "plan_to_watch";
      friendship_status: "pending" | "accepted" | "declined" | "blocked";
      profile_visibility: "public" | "friends_only" | "private";
      ranking_confidence: "low" | "medium" | "high";
      series_map_source: "anilist_auto" | "manual_override" | "singleton";
      series_override_action:
        | "force_series"
        | "force_singleton"
        | "exclude_from_auto_group";
      watchlist_priority: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

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
      friendship_status: ["pending", "accepted", "declined", "blocked"],
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
} as const;
