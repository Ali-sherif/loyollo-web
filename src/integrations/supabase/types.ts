export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          is_main: boolean;
          manager_name: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_main?: boolean;
          manager_name?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_main?: boolean;
          manager_name?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_automations: {
        Row: {
          config: Json | null;
          created_at: string;
          enabled: boolean;
          id: string;
          name: string;
          owner_id: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          config?: Json | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          name: string;
          owner_id: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          config?: Json | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          name?: string;
          owner_id?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_recipients: {
        Row: {
          campaign_id: string;
          channel: string;
          created_at: string;
          customer_id: string;
          error_message: string | null;
          id: string;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          campaign_id: string;
          channel: string;
          created_at?: string;
          customer_id: string;
          error_message?: string | null;
          id?: string;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          campaign_id?: string;
          channel?: string;
          created_at?: string;
          customer_id?: string;
          error_message?: string | null;
          id?: string;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_recipients_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          audience: string | null;
          channel: string;
          clicked_count: number;
          created_at: string;
          description: string | null;
          failed_count: number;
          id: string;
          loyalty_program_id: string;
          message: string | null;
          name: string;
          opened_count: number;
          owner_id: string;
          revenue_cents: number;
          scheduled_at: string | null;
          sent_at: string | null;
          sent_count: number;
          status: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          audience?: string | null;
          channel?: string;
          clicked_count?: number;
          created_at?: string;
          description?: string | null;
          failed_count?: number;
          id?: string;
          loyalty_program_id: string;
          message?: string | null;
          name: string;
          opened_count?: number;
          owner_id: string;
          revenue_cents?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          audience?: string | null;
          channel?: string;
          clicked_count?: number;
          created_at?: string;
          description?: string | null;
          failed_count?: number;
          id?: string;
          loyalty_program_id?: string;
          message?: string | null;
          name?: string;
          opened_count?: number;
          owner_id?: string;
          revenue_cents?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_rewards: {
        Row: {
          created_at: string;
          customer_id: string;
          earned_at: string;
          id: string;
          loyalty_program_id: string;
          milestone: number;
          redeemed_at: string | null;
          reward_id: string | null;
          reward_name_snapshot: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          earned_at?: string;
          id?: string;
          loyalty_program_id: string;
          milestone: number;
          redeemed_at?: string | null;
          reward_id?: string | null;
          reward_name_snapshot: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          earned_at?: string;
          id?: string;
          loyalty_program_id?: string;
          milestone?: number;
          redeemed_at?: string | null;
          reward_id?: string | null;
          reward_name_snapshot?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_rewards_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_rewards_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_rewards_reward_id_fkey";
            columns: ["reward_id"];
            isOneToOne: false;
            referencedRelation: "rewards";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          birth_date: string | null;
          city: string | null;
          created_at: string;
          custom_field_value: string | null;
          email: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          last_activity_at: string | null;
          loyalty_program_id: string;
          phone: string | null;
          points: number;
          status: string;
          tier: string | null;
          updated_at: string;
          visits: number;
        };
        Insert: {
          birth_date?: string | null;
          city?: string | null;
          created_at?: string;
          custom_field_value?: string | null;
          email?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          last_activity_at?: string | null;
          loyalty_program_id: string;
          phone?: string | null;
          points?: number;
          status?: string;
          tier?: string | null;
          updated_at?: string;
          visits?: number;
        };
        Update: {
          birth_date?: string | null;
          city?: string | null;
          created_at?: string;
          custom_field_value?: string | null;
          email?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          last_activity_at?: string | null;
          loyalty_program_id?: string;
          phone?: string | null;
          points?: number;
          status?: string;
          tier?: string | null;
          updated_at?: string;
          visits?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customers_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      email_send_log: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          message_id: string | null;
          metadata: Json | null;
          recipient_email: string;
          status: string;
          template_name: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          recipient_email: string;
          status: string;
          template_name: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          recipient_email?: string;
          status?: string;
          template_name?: string;
        };
        Relationships: [];
      };
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number;
          batch_size: number;
          id: number;
          retry_after_until: string | null;
          send_delay_ms: number;
          transactional_email_ttl_minutes: number;
          updated_at: string;
        };
        Insert: {
          auth_email_ttl_minutes?: number;
          batch_size?: number;
          id?: number;
          retry_after_until?: string | null;
          send_delay_ms?: number;
          transactional_email_ttl_minutes?: number;
          updated_at?: string;
        };
        Update: {
          auth_email_ttl_minutes?: number;
          batch_size?: number;
          id?: number;
          retry_after_until?: string | null;
          send_delay_ms?: number;
          transactional_email_ttl_minutes?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_unsubscribe_tokens: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          token: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          token: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          token?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          connected_at: string | null;
          created_at: string;
          id: string;
          metadata: Json | null;
          owner_id: string;
          provider: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          connected_at?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          owner_id: string;
          provider: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          connected_at?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          owner_id?: string;
          provider?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      loyalty_program_tiers: {
        Row: {
          benefits: string[];
          bonus_percentage: number;
          color: string;
          created_at: string;
          id: string;
          loyalty_program_id: string;
          name: string;
          points_multiplier: number;
          points_threshold: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          benefits?: string[];
          bonus_percentage?: number;
          color?: string;
          created_at?: string;
          id?: string;
          loyalty_program_id: string;
          name: string;
          points_multiplier?: number;
          points_threshold?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          benefits?: string[];
          bonus_percentage?: number;
          color?: string;
          created_at?: string;
          id?: string;
          loyalty_program_id?: string;
          name?: string;
          points_multiplier?: number;
          points_threshold?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_program_tiers_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_programs: {
        Row: {
          after_reward_action: string | null;
          bonus_signup_points: boolean;
          bonus_stamp_signup: boolean;
          card_expiry_days: number;
          created_at: string;
          description: string | null;
          double_points_birthdays: boolean;
          double_stamp_weekends: boolean;
          grace_period_months: number;
          id: string;
          max_visits_per_day: number;
          min_spend_per_visit: number;
          minimum_spend: number;
          name: string;
          notify_one_visit_away: boolean;
          notify_tier_upgrade: boolean;
          owner_id: string;
          points_earned: number;
          points_expiry_months: number;
          program_type: Database["public"]["Enums"]["loyalty_program_type"];
          reward_on_completion: string | null;
          spend_amount: number;
          tier_downgrade_protection: boolean;
          tier_measured_by: string | null;
          tier_reset_period: string | null;
          updated_at: string;
          visits_required: number;
        };
        Insert: {
          after_reward_action?: string | null;
          bonus_signup_points?: boolean;
          bonus_stamp_signup?: boolean;
          card_expiry_days?: number;
          created_at?: string;
          description?: string | null;
          double_points_birthdays?: boolean;
          double_stamp_weekends?: boolean;
          grace_period_months?: number;
          id?: string;
          max_visits_per_day?: number;
          min_spend_per_visit?: number;
          minimum_spend?: number;
          name?: string;
          notify_one_visit_away?: boolean;
          notify_tier_upgrade?: boolean;
          owner_id: string;
          points_earned?: number;
          points_expiry_months?: number;
          program_type?: Database["public"]["Enums"]["loyalty_program_type"];
          reward_on_completion?: string | null;
          spend_amount?: number;
          tier_downgrade_protection?: boolean;
          tier_measured_by?: string | null;
          tier_reset_period?: string | null;
          updated_at?: string;
          visits_required?: number;
        };
        Update: {
          after_reward_action?: string | null;
          bonus_signup_points?: boolean;
          bonus_stamp_signup?: boolean;
          card_expiry_days?: number;
          created_at?: string;
          description?: string | null;
          double_points_birthdays?: boolean;
          double_stamp_weekends?: boolean;
          grace_period_months?: number;
          id?: string;
          max_visits_per_day?: number;
          min_spend_per_visit?: number;
          minimum_spend?: number;
          name?: string;
          notify_one_visit_away?: boolean;
          notify_tier_upgrade?: boolean;
          owner_id?: string;
          points_earned?: number;
          points_expiry_months?: number;
          program_type?: Database["public"]["Enums"]["loyalty_program_type"];
          reward_on_completion?: string | null;
          spend_amount?: number;
          tier_downgrade_protection?: boolean;
          tier_measured_by?: string | null;
          tier_reset_period?: string | null;
          updated_at?: string;
          visits_required?: number;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          branch_added: boolean;
          campaign_created: boolean;
          created_at: string;
          id: string;
          monthly_report: boolean;
          new_customer_joined: boolean;
          reward_earned: boolean;
          reward_redeemed: boolean;
          updated_at: string;
          weekly_summary: boolean;
        };
        Insert: {
          branch_added?: boolean;
          campaign_created?: boolean;
          created_at?: string;
          id: string;
          monthly_report?: boolean;
          new_customer_joined?: boolean;
          reward_earned?: boolean;
          reward_redeemed?: boolean;
          updated_at?: string;
          weekly_summary?: boolean;
        };
        Update: {
          branch_added?: boolean;
          campaign_created?: boolean;
          created_at?: string;
          id?: string;
          monthly_report?: boolean;
          new_customer_joined?: boolean;
          reward_earned?: boolean;
          reward_redeemed?: boolean;
          updated_at?: string;
          weekly_summary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          link: string | null;
          message: string;
          read: boolean;
          recipient_id: string;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          link?: string | null;
          message: string;
          read?: boolean;
          recipient_id: string;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          link?: string | null;
          message?: string;
          read?: boolean;
          recipient_id?: string;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          avg_cheque_per_day: number | null;
          avg_customers_per_day: string | null;
          business_category: string | null;
          business_name: string | null;
          business_type: string | null;
          cheque_currency: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          currency: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          industry: string | null;
          main_location: string | null;
          num_locations: string | null;
          onboarding_completed: boolean;
          phone: string | null;
          plan: string | null;
          province: string | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          avg_cheque_per_day?: number | null;
          avg_customers_per_day?: string | null;
          business_category?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          cheque_currency?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          industry?: string | null;
          main_location?: string | null;
          num_locations?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          plan?: string | null;
          province?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          avg_cheque_per_day?: number | null;
          avg_customers_per_day?: string | null;
          business_category?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          cheque_currency?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          industry?: string | null;
          main_location?: string | null;
          num_locations?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          plan?: string | null;
          province?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      qr_page_settings: {
        Row: {
          background_color: string;
          business_name_override: string | null;
          button_color: string;
          button_text: string;
          button_text_color: string;
          cover_image_url: string | null;
          created_at: string;
          custom_field_label: string | null;
          form_fields: Json;
          id: string;
          logo_url: string | null;
          loyalty_program_id: string;
          primary_color: string;
          secondary_color: string;
          short_description: string | null;
          show_program_description: boolean;
          show_referral_section: boolean;
          show_rewards_preview: boolean;
          show_terms: boolean;
          show_welcome_message: boolean;
          updated_at: string;
          welcome_headline: string | null;
        };
        Insert: {
          background_color?: string;
          business_name_override?: string | null;
          button_color?: string;
          button_text?: string;
          button_text_color?: string;
          cover_image_url?: string | null;
          created_at?: string;
          custom_field_label?: string | null;
          form_fields?: Json;
          id?: string;
          logo_url?: string | null;
          loyalty_program_id: string;
          primary_color?: string;
          secondary_color?: string;
          short_description?: string | null;
          show_program_description?: boolean;
          show_referral_section?: boolean;
          show_rewards_preview?: boolean;
          show_terms?: boolean;
          show_welcome_message?: boolean;
          updated_at?: string;
          welcome_headline?: string | null;
        };
        Update: {
          background_color?: string;
          business_name_override?: string | null;
          button_color?: string;
          button_text?: string;
          button_text_color?: string;
          cover_image_url?: string | null;
          created_at?: string;
          custom_field_label?: string | null;
          form_fields?: Json;
          id?: string;
          logo_url?: string | null;
          loyalty_program_id?: string;
          primary_color?: string;
          secondary_color?: string;
          short_description?: string | null;
          show_program_description?: boolean;
          show_referral_section?: boolean;
          show_rewards_preview?: boolean;
          show_terms?: boolean;
          show_welcome_message?: boolean;
          updated_at?: string;
          welcome_headline?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "qr_page_settings_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: true;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_settings: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          loyalty_program_id: string;
          new_customer_discount_pct: number;
          referrer_bonus_points: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          loyalty_program_id: string;
          new_customer_discount_pct?: number;
          referrer_bonus_points?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          loyalty_program_id?: string;
          new_customer_discount_pct?: number;
          referrer_bonus_points?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_settings_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: true;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      rewards: {
        Row: {
          created_at: string;
          description: string;
          icon: string;
          id: string;
          loyalty_program_id: string;
          monthly_limit: number | null;
          name: string;
          point_cost: number | null;
          redeemed_count: number;
          sort_order: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          loyalty_program_id: string;
          monthly_limit?: number | null;
          name: string;
          point_cost?: number | null;
          redeemed_count?: number;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          loyalty_program_id?: string;
          monthly_limit?: number | null;
          name?: string;
          point_cost?: number | null;
          redeemed_count?: number;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      suppressed_emails: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          metadata: Json | null;
          reason: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          metadata?: Json | null;
          reason: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          metadata?: Json | null;
          reason?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string };
        Returns: boolean;
      };
      email_queue_dispatch: { Args: never; Returns: undefined };
      enqueue_email: {
        Args: { payload: Json; queue_name: string };
        Returns: number;
      };
      mint_unsubscribe_token: { Args: { p_email: string }; Returns: string };
      move_to_dlq: {
        Args: {
          dlq_name: string;
          message_id: number;
          payload: Json;
          source_queue: string;
        };
        Returns: number;
      };
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number };
        Returns: {
          message: Json;
          msg_id: number;
          read_ct: number;
        }[];
      };
      send_monthly_report_emails: { Args: never; Returns: number };
      send_owner_period_report: {
        Args: {
          heading_text: string;
          include_branches: boolean;
          period_human: string;
          period_label: string;
          pref_column: string;
          subject_line: string;
          window_end: string;
          window_start: string;
        };
        Returns: number;
      };
      send_weekly_summary_emails: { Args: never; Returns: number };
    };
    Enums: {
      loyalty_program_type: "points" | "visit" | "tier";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      loyalty_program_type: ["points", "visit", "tier"],
    },
  },
} as const;
