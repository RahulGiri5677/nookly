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
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          entry_marked: boolean | null
          entry_time: string | null
          exit_marked: boolean | null
          exit_time: string | null
          id: string
          marked_at: string | null
          marked_by: string | null
          nook_id: string
          scanned_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_marked?: boolean | null
          entry_time?: string | null
          exit_marked?: boolean | null
          exit_time?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          nook_id: string
          scanned_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_marked?: boolean | null
          entry_time?: string | null
          exit_marked?: boolean | null
          exit_time?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          nook_id?: string
          scanned_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          provider_response: Json | null
          recipient: string
          status: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          provider_response?: Json | null
          recipient: string
          status?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          provider_response?: Json | null
          recipient?: string
          status?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          admin_only: boolean
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          admin_only?: boolean
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          admin_only?: boolean
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comfort_level: string | null
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          is_report: boolean | null
          nook_id: string
          nook_title: string | null
          rating: number
          role: string
          tags: string[] | null
          to_user_id: string | null
        }
        Insert: {
          comfort_level?: string | null
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          is_report?: boolean | null
          nook_id: string
          nook_title?: string | null
          rating: number
          role?: string
          tags?: string[] | null
          to_user_id?: string | null
        }
        Update: {
          comfort_level?: string | null
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          is_report?: boolean | null
          nook_id?: string
          nook_title?: string | null
          rating?: number
          role?: string
          tags?: string[] | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks_public"
            referencedColumns: ["id"]
          },
        ]
      }
      join_attempt_logs: {
        Row: {
          allowed: boolean
          code: string
          created_at: string
          id: string
          nook_id: string
          user_id: string
        }
        Insert: {
          allowed: boolean
          code: string
          created_at?: string
          id?: string
          nook_id: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          code?: string
          created_at?: string
          id?: string
          nook_id?: string
          user_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          comment: string
          created_at: string
          id: string
          reason: string | null
          reviewed: boolean
          severity: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed?: boolean
          severity: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed?: boolean
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      nook_members: {
        Row: {
          arrival_status: string | null
          arrival_timestamp: string | null
          commitment_status: string | null
          created_at: string
          id: string
          nook_id: string
          status: string
          user_id: string
        }
        Insert: {
          arrival_status?: string | null
          arrival_timestamp?: string | null
          commitment_status?: string | null
          created_at?: string
          id?: string
          nook_id: string
          status?: string
          user_id: string
        }
        Update: {
          arrival_status?: string | null
          arrival_timestamp?: string | null
          commitment_status?: string | null
          created_at?: string
          id?: string
          nook_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nook_members_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nook_members_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks_public"
            referencedColumns: ["id"]
          },
        ]
      }
      nooks: {
        Row: {
          auto_cancelled: boolean
          cancelled_at: string | null
          cancelled_by: string | null
          category: string
          city: string
          comfort_detail: string | null
          created_at: string
          current_people: number
          date_time: string
          duration_minutes: number
          gender_restriction: string
          google_maps_link: string | null
          host_id: string
          host_mode_active: boolean | null
          icebreaker: string | null
          id: string
          inclusive_non_binary: boolean
          max_people: number
          min_people: number
          no_show_processed: boolean | null
          nook_code: string | null
          qr_secret: string | null
          reminder_sent: boolean
          status: string
          topic: string
          updated_at: string
          venue: string
          venue_note: string | null
          wheelchair_friendly: boolean
        }
        Insert: {
          auto_cancelled?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string
          city: string
          comfort_detail?: string | null
          created_at?: string
          current_people?: number
          date_time: string
          duration_minutes?: number
          gender_restriction?: string
          google_maps_link?: string | null
          host_id: string
          host_mode_active?: boolean | null
          icebreaker?: string | null
          id?: string
          inclusive_non_binary?: boolean
          max_people?: number
          min_people?: number
          no_show_processed?: boolean | null
          nook_code?: string | null
          qr_secret?: string | null
          reminder_sent?: boolean
          status?: string
          topic: string
          updated_at?: string
          venue: string
          venue_note?: string | null
          wheelchair_friendly?: boolean
        }
        Update: {
          auto_cancelled?: boolean
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string
          city?: string
          comfort_detail?: string | null
          created_at?: string
          current_people?: number
          date_time?: string
          duration_minutes?: number
          gender_restriction?: string
          google_maps_link?: string | null
          host_id?: string
          host_mode_active?: boolean | null
          icebreaker?: string | null
          id?: string
          inclusive_non_binary?: boolean
          max_people?: number
          min_people?: number
          no_show_processed?: boolean | null
          nook_code?: string | null
          qr_secret?: string | null
          reminder_sent?: boolean
          status?: string
          topic?: string
          updated_at?: string
          venue?: string
          venue_note?: string | null
          wheelchair_friendly?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          nook_id: string | null
          nook_title: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          nook_id?: string | null
          nook_title?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          nook_id?: string | null
          nook_title?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          credibility_score: number
          display_name: string | null
          dob: string | null
          full_name: string | null
          gender: string | null
          host_no_shows: number
          id: string
          interests: string[] | null
          location_visibility: string | null
          meetup_preference: string | null
          meetups_attended: number
          meetups_hosted: number
          no_shows: number
          notification_prefs: Json | null
          phone: string | null
          photo_visibility: string | null
          profile_photo_url: string | null
          show_age: boolean | null
          show_full_name: boolean | null
          show_gender: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          credibility_score?: number
          display_name?: string | null
          dob?: string | null
          full_name?: string | null
          gender?: string | null
          host_no_shows?: number
          id?: string
          interests?: string[] | null
          location_visibility?: string | null
          meetup_preference?: string | null
          meetups_attended?: number
          meetups_hosted?: number
          no_shows?: number
          notification_prefs?: Json | null
          phone?: string | null
          photo_visibility?: string | null
          profile_photo_url?: string | null
          show_age?: boolean | null
          show_full_name?: boolean | null
          show_gender?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          credibility_score?: number
          display_name?: string | null
          dob?: string | null
          full_name?: string | null
          gender?: string | null
          host_no_shows?: number
          id?: string
          interests?: string[] | null
          location_visibility?: string | null
          meetup_preference?: string | null
          meetups_attended?: number
          meetups_hosted?: number
          no_shows?: number
          notification_prefs?: Json | null
          phone?: string | null
          photo_visibility?: string | null
          profile_photo_url?: string | null
          show_age?: boolean | null
          show_full_name?: boolean | null
          show_gender?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          action_requested: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          nook_id: string | null
          reported_user_id: string | null
          reporter_user_id: string
        }
        Insert: {
          action_requested?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          nook_id?: string | null
          reported_user_id?: string | null
          reporter_user_id: string
        }
        Update: {
          action_requested?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          nook_id?: string | null
          reported_user_id?: string | null
          reporter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_nook_id_fkey"
            columns: ["nook_id"]
            isOneToOne: false
            referencedRelation: "nooks_public"
            referencedColumns: ["id"]
          },
        ]
      }
      system_cron_logs: {
        Row: {
          id: string
          job_name: string
          ran_at: string
          result: Json | null
        }
        Insert: {
          id?: string
          job_name: string
          ran_at?: string
          result?: Json | null
        }
        Update: {
          id?: string
          job_name?: string
          ran_at?: string
          result?: Json | null
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          resource_id: string | null
          resource_type: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      nooks_public: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          category: string | null
          city: string | null
          comfort_detail: string | null
          created_at: string | null
          current_people: number | null
          date_time: string | null
          duration_minutes: number | null
          gender_restriction: string | null
          google_maps_link: string | null
          host_id: string | null
          host_mode_active: boolean | null
          icebreaker: string | null
          id: string | null
          inclusive_non_binary: boolean | null
          max_people: number | null
          min_people: number | null
          no_show_processed: boolean | null
          nook_code: string | null
          status: string | null
          topic: string | null
          updated_at: string | null
          venue: string | null
          venue_note: string | null
          wheelchair_friendly: boolean | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string | null
          city?: string | null
          comfort_detail?: string | null
          created_at?: string | null
          current_people?: number | null
          date_time?: string | null
          duration_minutes?: number | null
          gender_restriction?: string | null
          google_maps_link?: string | null
          host_id?: string | null
          host_mode_active?: boolean | null
          icebreaker?: string | null
          id?: string | null
          inclusive_non_binary?: boolean | null
          max_people?: number | null
          min_people?: number | null
          no_show_processed?: boolean | null
          nook_code?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_note?: string | null
          wheelchair_friendly?: boolean | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          category?: string | null
          city?: string | null
          comfort_detail?: string | null
          created_at?: string | null
          current_people?: number | null
          date_time?: string | null
          duration_minutes?: number | null
          gender_restriction?: string | null
          google_maps_link?: string | null
          host_id?: string | null
          host_mode_active?: boolean | null
          icebreaker?: string | null
          id?: string | null
          inclusive_non_binary?: boolean | null
          max_people?: number | null
          min_people?: number | null
          no_show_processed?: boolean | null
          nook_code?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_note?: string | null
          wheelchair_friendly?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_host_eligibility: { Args: { p_user_id: string }; Returns: Json }
      check_join_eligibility: { Args: { p_user_id: string }; Returns: Json }
      check_nook_join_safety: {
        Args: { p_nook_id: string; p_user_id: string }
        Returns: Json
      }
      get_badge_tier: { Args: { p_user_id: string }; Returns: Json }
      get_db_trigger_secret: { Args: never; Returns: string }
      get_display_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      get_public_schema: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_counts: { Args: never; Returns: Json }
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
