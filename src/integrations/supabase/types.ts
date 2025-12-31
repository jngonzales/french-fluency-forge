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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      archetype_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          id: string
          marketing_consent: boolean
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text: string
          id?: string
          marketing_consent?: boolean
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string
          id?: string
          marketing_consent?: boolean
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archetype_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          age_band: Database["public"]["Enums"]["age_band_type"] | null
          archetype: string | null
          completed_at: string | null
          created_at: string
          fluency_locked: boolean
          fluency_locked_at: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          goals: string | null
          id: string
          languages_spoken: string[] | null
          primary_track: Database["public"]["Enums"]["track_type"] | null
          purchase_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
          variant: string | null
        }
        Insert: {
          age_band?: Database["public"]["Enums"]["age_band_type"] | null
          archetype?: string | null
          completed_at?: string | null
          created_at?: string
          fluency_locked?: boolean
          fluency_locked_at?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goals?: string | null
          id?: string
          languages_spoken?: string[] | null
          primary_track?: Database["public"]["Enums"]["track_type"] | null
          purchase_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          age_band?: Database["public"]["Enums"]["age_band_type"] | null
          archetype?: string | null
          completed_at?: string | null
          created_at?: string
          fluency_locked?: boolean
          fluency_locked_at?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goals?: string | null
          id?: string
          languages_spoken?: string[] | null
          primary_track?: Database["public"]["Enums"]["track_type"] | null
          purchase_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consented_at: string
          data_processing_consent: boolean
          id: string
          ip_address: string | null
          recording_consent: boolean
          retention_acknowledged: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consented_at?: string
          data_processing_consent?: boolean
          id?: string
          ip_address?: string | null
          recording_consent?: boolean
          retention_acknowledged?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consented_at?: string
          data_processing_consent?: boolean
          id?: string
          ip_address?: string | null
          recording_consent?: boolean
          retention_acknowledged?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fluency_events: {
        Row: {
          attempt_number: number | null
          created_at: string
          event_type: string
          id: string
          item_id: string | null
          metadata: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          event_type: string
          id?: string
          item_id?: string | null
          metadata?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          event_type?: string
          id?: string
          item_id?: string | null
          metadata?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fluency_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluency_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fluency_recordings: {
        Row: {
          attempt_number: number
          audio_storage_path: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          item_id: string
          pause_count: number | null
          session_id: string
          status: string
          superseded: boolean
          total_pause_duration: number | null
          transcript: string | null
          used_for_scoring: boolean
          user_id: string
          word_count: number | null
          wpm: number | null
        }
        Insert: {
          attempt_number?: number
          audio_storage_path?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          item_id: string
          pause_count?: number | null
          session_id: string
          status?: string
          superseded?: boolean
          total_pause_duration?: number | null
          transcript?: string | null
          used_for_scoring?: boolean
          user_id: string
          word_count?: number | null
          wpm?: number | null
        }
        Update: {
          attempt_number?: number
          audio_storage_path?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          item_id?: string
          pause_count?: number | null
          session_id?: string
          status?: string
          superseded?: boolean
          total_pause_duration?: number | null
          transcript?: string | null
          used_for_scoring?: boolean
          user_id?: string
          word_count?: number | null
          wpm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fluency_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluency_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          currency: string
          email: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      age_band_type: "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus"
      gender_type: "male" | "female" | "non_binary" | "prefer_not"
      session_status:
        | "intake"
        | "consent"
        | "quiz"
        | "mic_check"
        | "assessment"
        | "processing"
        | "completed"
        | "abandoned"
      track_type:
        | "small_talk"
        | "transactions"
        | "bilingual_friends"
        | "work"
        | "home"
        | "in_laws"
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
      age_band_type: ["18_24", "25_34", "35_44", "45_54", "55_64", "65_plus"],
      gender_type: ["male", "female", "non_binary", "prefer_not"],
      session_status: [
        "intake",
        "consent",
        "quiz",
        "mic_check",
        "assessment",
        "processing",
        "completed",
        "abandoned",
      ],
      track_type: [
        "small_talk",
        "transactions",
        "bilingual_friends",
        "work",
        "home",
        "in_laws",
      ],
    },
  },
} as const
