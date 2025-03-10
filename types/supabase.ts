export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audio_tracks: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string | null
          duration: number | null
          id: string
          is_built_in: boolean | null
          is_public: boolean | null
          name: string
          url: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_built_in?: boolean | null
          is_public?: boolean | null
          name: string
          url: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          is_built_in?: boolean | null
          is_public?: boolean | null
          name?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_tracks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sound_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites_mixes: {
        Row: {
          created_at: string | null
          id: string
          mix_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mix_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mix_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_mixes_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "meditation_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_mixes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites_sounds: {
        Row: {
          created_at: string | null
          id: string
          sound_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          sound_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          sound_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_sounds_sound_id_fkey"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_sounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_mixes: {
        Row: {
          category_id: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_public: boolean | null
          likes_count: number | null
          name: string
          tags: string[] | null
          tracks: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          name: string
          tags?: string[] | null
          tracks: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          name?: string
          tags?: string[] | null
          tracks?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meditation_mixes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mix_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meditation_mixes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_sessions: {
        Row: {
          created_at: string | null
          duration: string | null
          id: string
          name: string
          sounds: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          id?: string
          name: string
          sounds?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          id?: string
          name?: string
          sounds?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meditation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mix_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mix_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mix_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mix_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mix_comments_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "meditation_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_components: {
        Row: {
          created_at: string | null
          end_time: number | null
          id: string
          loop: boolean | null
          mix_id: string | null
          start_time: number | null
          track_id: string | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          end_time?: number | null
          id?: string
          loop?: boolean | null
          mix_id?: string | null
          start_time?: number | null
          track_id?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          end_time?: number | null
          id?: string
          loop?: boolean | null
          mix_id?: string | null
          start_time?: number | null
          track_id?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mix_components_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "meditation_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_components_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_likes: {
        Row: {
          created_at: string | null
          id: string
          mix_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mix_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mix_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mix_likes_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "meditation_mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mix_tracks: {
        Row: {
          created_at: string
          id: string
          mix_id: string
          track_id: string
          volume: number
        }
        Insert: {
          created_at?: string
          id?: string
          mix_id: string
          track_id: string
          volume?: number
        }
        Update: {
          created_at?: string
          id?: string
          mix_id?: string
          track_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "mix_tracks_mix_id_fkey"
            columns: ["mix_id"]
            isOneToOne: false
            referencedRelation: "mixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mix_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      mixes: {
        Row: {
          created_at: string
          duration: number
          id: string
          is_public: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number
          id?: string
          is_public?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          is_public?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_duration: number | null
          email: string | null
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          nickname: string | null
          notifications: boolean | null
          preferred_background: string | null
          preferred_voice: string | null
          subscription_type: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_duration?: number | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          nickname?: string | null
          notifications?: boolean | null
          preferred_background?: string | null
          preferred_voice?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_duration?: number | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          nickname?: string | null
          notifications?: boolean | null
          preferred_background?: string | null
          preferred_voice?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sound_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tracks: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string
          duration: number
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description: string
          duration?: number
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string
          duration?: number
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mixes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          tracks: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          tracks?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          tracks?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_subscription_column_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_mix_track_settings: {
        Args: {
          mix_id: string
          track_id?: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      toggle_user_admin: {
        Args: {
          user_id: string
          make_admin: boolean
        }
        Returns: undefined
      }
      update_mix_track_settings: {
        Args: {
          mix_id: string
          track_id: string
          settings: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
