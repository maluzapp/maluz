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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      branding_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          answers_data: Json | null
          child_profile_id: string
          completed_at: string | null
          created_at: string
          exercises_data: Json | null
          id: string
          message: string | null
          parent_profile_id: string
          score: number | null
          status: string
          subject: string
          topic: string
          total: number | null
          year: string
        }
        Insert: {
          answers_data?: Json | null
          child_profile_id: string
          completed_at?: string | null
          created_at?: string
          exercises_data?: Json | null
          id?: string
          message?: string | null
          parent_profile_id: string
          score?: number | null
          status?: string
          subject: string
          topic: string
          total?: number | null
          year: string
        }
        Update: {
          answers_data?: Json | null
          child_profile_id?: string
          completed_at?: string | null
          created_at?: string
          exercises_data?: Json | null
          id?: string
          message?: string | null
          parent_profile_id?: string
          score?: number | null
          status?: string
          subject?: string
          topic?: string
          total?: number | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_child"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_parent"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          sessions_count: number
          usage_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          sessions_count?: number
          usage_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          sessions_count?: number
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          requester_profile_id: string
          status: string
          target_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_profile_id: string
          status?: string
          target_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_profile_id?: string
          status?: string
          target_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          profile_id: string
          used: boolean
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          profile_id: string
          used?: boolean
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string
          used?: boolean
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string
          id: string
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string
          icon_emoji: string
          id: string
          inactive_days: number | null
          is_active: boolean
          title: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          channel?: string
          created_at?: string
          icon_emoji?: string
          id?: string
          inactive_days?: number | null
          is_active?: boolean
          title: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string
          icon_emoji?: string
          id?: string
          inactive_days?: number | null
          is_active?: boolean
          title?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_child_links: {
        Row: {
          child_profile_id: string
          created_at: string
          id: string
          parent_profile_id: string
        }
        Insert: {
          child_profile_id: string
          created_at?: string
          id?: string
          parent_profile_id: string
        }
        Update: {
          child_profile_id?: string
          created_at?: string
          id?: string
          parent_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_links_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_links_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_emoji: string
          created_at: string
          friend_code: string | null
          id: string
          last_active_at: string | null
          last_study_date: string | null
          level: number
          name: string
          profile_type: string
          school_year: string | null
          streak_days: number
          total_correct: number
          total_exercises: number
          user_id: string
          xp: number
        }
        Insert: {
          avatar_emoji?: string
          created_at?: string
          friend_code?: string | null
          id?: string
          last_active_at?: string | null
          last_study_date?: string | null
          level?: number
          name: string
          profile_type?: string
          school_year?: string | null
          streak_days?: number
          total_correct?: number
          total_exercises?: number
          user_id: string
          xp?: number
        }
        Update: {
          avatar_emoji?: string
          created_at?: string
          friend_code?: string | null
          id?: string
          last_active_at?: string | null
          last_study_date?: string | null
          level?: number
          name?: string
          profile_type?: string
          school_year?: string | null
          streak_days?: number
          total_correct?: number
          total_exercises?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          profile_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          profile_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          profile_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      spouse_links: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          spouse_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          spouse_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          spouse_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spouse_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spouse_links_spouse_profile_id_fkey"
            columns: ["spouse_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          answers_data: Json | null
          created_at: string
          exercises_data: Json | null
          id: string
          profile_id: string
          score: number
          subject: string
          topic: string
          total: number
          xp_earned: number
          year: string
        }
        Insert: {
          answers_data?: Json | null
          created_at?: string
          exercises_data?: Json | null
          id?: string
          profile_id: string
          score: number
          subject: string
          topic: string
          total: number
          xp_earned?: number
          year: string
        }
        Update: {
          answers_data?: Json | null
          created_at?: string
          exercises_data?: Json | null
          id?: string
          profile_id?: string
          score?: number
          subject?: string
          topic?: string
          total?: number
          xp_earned?: number
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          daily_session_limit: number
          features: Json
          id: string
          is_active: boolean
          max_profiles: number
          name: string
          price_monthly: number
          price_weekly: number | null
          price_yearly: number | null
          slug: string
          sort_order: number
          store_product_id_apple: string | null
          store_product_id_google: string | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          daily_session_limit?: number
          features?: Json
          id?: string
          is_active?: boolean
          max_profiles?: number
          name: string
          price_monthly?: number
          price_weekly?: number | null
          price_yearly?: number | null
          slug: string
          sort_order?: number
          store_product_id_apple?: string | null
          store_product_id_google?: string | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          daily_session_limit?: number
          features?: Json
          id?: string
          is_active?: boolean
          max_profiles?: number
          name?: string
          price_monthly?: number
          price_weekly?: number | null
          price_yearly?: number | null
          slug?: string
          sort_order?: number
          store_product_id_apple?: string | null
          store_product_id_google?: string | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_period: string
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          store_provider: string | null
          store_transaction_id: string | null
          user_id: string
        }
        Insert: {
          billing_period?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          store_provider?: string | null
          store_transaction_id?: string | null
          user_id: string
        }
        Update: {
          billing_period?: string
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          store_provider?: string | null
          store_transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile: { Args: { _profile_id: string }; Returns: boolean }
      find_profile_by_friend_code: {
        Args: { _code: string }
        Returns: {
          avatar_emoji: string
          friend_code: string
          id: string
          level: number
          name: string
          streak_days: number
          xp: number
        }[]
      }
      get_effective_plan_user_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_global_ranking: {
        Args: { _limit?: number; _school_year?: string }
        Returns: {
          avatar_emoji: string
          id: string
          level: number
          name: string
          rank: number
          school_year: string
          streak_days: number
          xp: number
        }[]
      }
      get_my_global_rank: {
        Args: { _profile_id: string }
        Returns: {
          rank: number
          total: number
        }[]
      }
      get_profiles_by_ids: {
        Args: { _ids: string[] }
        Returns: {
          avatar_emoji: string
          friend_code: string
          id: string
          level: number
          name: string
          streak_days: number
          xp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_friend: { Args: { _profile_id: string }; Returns: boolean }
      owns_profile: { Args: { _profile_id: string }; Returns: boolean }
      touch_profile_activity: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
