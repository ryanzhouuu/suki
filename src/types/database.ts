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
      profiles: {
        Row: {
          avatar_url: string | null;
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
      [_ in never]: never;
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
      watchlist_priority: ["low", "medium", "high"],
    },
  },
} as const;
