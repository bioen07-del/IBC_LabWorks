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
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action"]
          changes: Json | null
          comment: string | null
          entity_id: number
          entity_type: string
          id: number
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action"]
          changes?: Json | null
          comment?: string | null
          entity_id: number
          entity_type: string
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action"]
          changes?: Json | null
          comment?: string | null
          entity_id?: number
          entity_type?: string
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cca_rules: {
        Row: {
          block_process_on_fail: boolean | null
          condition: Json
          created_at: string | null
          created_by_user_id: number | null
          effective_from: string
          effective_to: string | null
          id: number
          is_active: boolean | null
          parameter_name: string
          rule_code: string
          rule_type: string
          scope: string | null
          severity: string | null
          sop_id: number | null
          step_number: number | null
        }
        Insert: {
          block_process_on_fail?: boolean | null
          condition: Json
          created_at?: string | null
          created_by_user_id?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: number
          is_active?: boolean | null
          parameter_name: string
          rule_code: string
          rule_type: string
          scope?: string | null
          severity?: string | null
          sop_id?: number | null
          step_number?: number | null
        }
        Update: {
          block_process_on_fail?: boolean | null
          condition?: Json
          created_at?: string | null
          created_by_user_id?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: number
          is_active?: boolean | null
          parameter_name?: string
          rule_code?: string
          rule_type?: string
          scope?: string | null
          severity?: string | null
          sop_id?: number | null
          step_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cca_rules_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_rules_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      combined_media_batch_components: {
        Row: {
          combined_media_batch_id: number
          created_at: string
          id: number
          media_component_batch_id: number
          quantity_used: number
          unit: string
        }
        Insert: {
          combined_media_batch_id: number
          created_at?: string
          id?: number
          media_component_batch_id: number
          quantity_used: number
          unit: string
        }
        Update: {
          combined_media_batch_id?: number
          created_at?: string
          id?: number
          media_component_batch_id?: number
          quantity_used?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "combined_media_batch_components_combined_media_batch_id_fkey"
            columns: ["combined_media_batch_id"]
            isOneToOne: false
            referencedRelation: "combined_media_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combined_media_batch_components_media_component_batch_id_fkey"
            columns: ["media_component_batch_id"]
            isOneToOne: false
            referencedRelation: "media_component_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      combined_media_batches: {
        Row: {
          batch_code: string
          created_at: string
          expiry_date: string
          id: number
          media_recipe_id: number
          notes: string | null
          preparation_date: string
          prepared_by_user_id: number | null
          qr_code_data: Json | null
          status: Database["public"]["Enums"]["media_batch_status"]
          sterility_status: Database["public"]["Enums"]["sterility_status"]
          storage_location_id: number | null
          volume_ml: number
          volume_remaining_ml: number
        }
        Insert: {
          batch_code: string
          created_at?: string
          expiry_date: string
          id?: number
          media_recipe_id: number
          notes?: string | null
          preparation_date: string
          prepared_by_user_id?: number | null
          qr_code_data?: Json | null
          status?: Database["public"]["Enums"]["media_batch_status"]
          sterility_status?: Database["public"]["Enums"]["sterility_status"]
          storage_location_id?: number | null
          volume_ml: number
          volume_remaining_ml: number
        }
        Update: {
          batch_code?: string
          created_at?: string
          expiry_date?: string
          id?: number
          media_recipe_id?: number
          notes?: string | null
          preparation_date?: string
          prepared_by_user_id?: number | null
          qr_code_data?: Json | null
          status?: Database["public"]["Enums"]["media_batch_status"]
          sterility_status?: Database["public"]["Enums"]["sterility_status"]
          storage_location_id?: number | null
          volume_ml?: number
          volume_remaining_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "combined_media_batches_media_recipe_id_fkey"
            columns: ["media_recipe_id"]
            isOneToOne: false
            referencedRelation: "media_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combined_media_batches_prepared_by_user_id_fkey"
            columns: ["prepared_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combined_media_batches_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      container_history: {
        Row: {
          container_id: number
          details: Json | null
          id: number
          notes: string | null
          operation: string
          performed_at: string | null
          performed_by_user_id: number | null
        }
        Insert: {
          container_id: number
          details?: Json | null
          id?: number
          notes?: string | null
          operation: string
          performed_at?: string | null
          performed_by_user_id?: number | null
        }
        Update: {
          container_id?: number
          details?: Json | null
          id?: number
          notes?: string | null
          operation?: string
          performed_at?: string | null
          performed_by_user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "container_history_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "container_history_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      container_media_usage: {
        Row: {
          container_id: number
          id: number
          media_batch_id: number
          used_at: string
          volume_ml: number | null
        }
        Insert: {
          container_id: number
          id?: number
          media_batch_id: number
          used_at?: string
          volume_ml?: number | null
        }
        Update: {
          container_id?: number
          id?: number
          media_batch_id?: number
          used_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "container_media_usage_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "container_media_usage_media_batch_id_fkey"
            columns: ["media_batch_id"]
            isOneToOne: false
            referencedRelation: "combined_media_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      container_types: {
        Row: {
          barcode_compatible: boolean | null
          cap_type: string | null
          catalog_number: string | null
          category: Database["public"]["Enums"]["container_category"]
          created_at: string
          id: number
          is_active: boolean
          manufacturer: string | null
          material: string | null
          max_temperature_c: number | null
          min_temperature_c: number | null
          notes: string | null
          sterile: boolean | null
          suitable_for_ln2: boolean | null
          suitable_for_minus80: boolean | null
          suitable_for_vapor: boolean | null
          surface_area_cm2: number | null
          type_code: string
          type_name: string
          volume_ml: number | null
        }
        Insert: {
          barcode_compatible?: boolean | null
          cap_type?: string | null
          catalog_number?: string | null
          category: Database["public"]["Enums"]["container_category"]
          created_at?: string
          id?: number
          is_active?: boolean
          manufacturer?: string | null
          material?: string | null
          max_temperature_c?: number | null
          min_temperature_c?: number | null
          notes?: string | null
          sterile?: boolean | null
          suitable_for_ln2?: boolean | null
          suitable_for_minus80?: boolean | null
          suitable_for_vapor?: boolean | null
          surface_area_cm2?: number | null
          type_code: string
          type_name: string
          volume_ml?: number | null
        }
        Update: {
          barcode_compatible?: boolean | null
          cap_type?: string | null
          catalog_number?: string | null
          category?: Database["public"]["Enums"]["container_category"]
          created_at?: string
          id?: number
          is_active?: boolean
          manufacturer?: string | null
          material?: string | null
          max_temperature_c?: number | null
          min_temperature_c?: number | null
          notes?: string | null
          sterile?: boolean | null
          suitable_for_ln2?: boolean | null
          suitable_for_minus80?: boolean | null
          suitable_for_vapor?: boolean | null
          surface_area_cm2?: number | null
          type_code?: string
          type_name?: string
          volume_ml?: number | null
        }
        Relationships: []
      }
      containers: {
        Row: {
          cell_concentration: number | null
          container_code: string
          container_type_id: number
          created_at: string
          created_by_user_id: number | null
          cryopreservation_media: string | null
          culture_id: number
          disposed_at: string | null
          freezing_rate: string | null
          frozen_at: string | null
          hold_reason: string | null
          hold_set_at: string | null
          hold_set_by_user_id: number | null
          id: number
          location_id: number | null
          parent_container_id: number | null
          passage_number: number
          qr_code_data: Json | null
          quality_hold: Database["public"]["Enums"]["container_quality_hold"]
          split_index: number
          status: Database["public"]["Enums"]["container_status"]
          storage_temperature: string | null
          thaw_duration_minutes: number | null
          thaw_method: string | null
          thawed_at: string | null
          updated_at: string
          viability_percent: number | null
          viability_post_thaw: number | null
          volume_ml: number | null
        }
        Insert: {
          cell_concentration?: number | null
          container_code: string
          container_type_id: number
          created_at?: string
          created_by_user_id?: number | null
          cryopreservation_media?: string | null
          culture_id: number
          disposed_at?: string | null
          freezing_rate?: string | null
          frozen_at?: string | null
          hold_reason?: string | null
          hold_set_at?: string | null
          hold_set_by_user_id?: number | null
          id?: number
          location_id?: number | null
          parent_container_id?: number | null
          passage_number?: number
          qr_code_data?: Json | null
          quality_hold?: Database["public"]["Enums"]["container_quality_hold"]
          split_index?: number
          status?: Database["public"]["Enums"]["container_status"]
          storage_temperature?: string | null
          thaw_duration_minutes?: number | null
          thaw_method?: string | null
          thawed_at?: string | null
          updated_at?: string
          viability_percent?: number | null
          viability_post_thaw?: number | null
          volume_ml?: number | null
        }
        Update: {
          cell_concentration?: number | null
          container_code?: string
          container_type_id?: number
          created_at?: string
          created_by_user_id?: number | null
          cryopreservation_media?: string | null
          culture_id?: number
          disposed_at?: string | null
          freezing_rate?: string | null
          frozen_at?: string | null
          hold_reason?: string | null
          hold_set_at?: string | null
          hold_set_by_user_id?: number | null
          id?: number
          location_id?: number | null
          parent_container_id?: number | null
          passage_number?: number
          qr_code_data?: Json | null
          quality_hold?: Database["public"]["Enums"]["container_quality_hold"]
          split_index?: number
          status?: Database["public"]["Enums"]["container_status"]
          storage_temperature?: string | null
          thaw_duration_minutes?: number | null
          thaw_method?: string | null
          thawed_at?: string | null
          updated_at?: string
          viability_percent?: number | null
          viability_post_thaw?: number | null
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "containers_container_type_id_fkey"
            columns: ["container_type_id"]
            isOneToOne: false
            referencedRelation: "container_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_hold_set_by_user_id_fkey"
            columns: ["hold_set_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_parent_container_id_fkey"
            columns: ["parent_container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_history: {
        Row: {
          action: string
          culture_id: number | null
          description: string | null
          id: number
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          culture_id?: number | null
          description?: string | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          culture_id?: number | null
          description?: string | null
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culture_history_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
        ]
      }
      cultures: {
        Row: {
          at_risk: boolean | null
          at_risk_reason: string | null
          at_risk_set_at: string | null
          at_risk_set_by_user_id: number | null
          cell_type: string
          created_at: string
          created_by_user_id: number | null
          culture_code: string
          culture_type: Database["public"]["Enums"]["culture_type"] | null
          current_passage: number
          donation_id: number
          id: number
          initial_process_template_id: number | null
          isolated_by_user_id: number | null
          isolation_date: string | null
          media_batch_used_id: number | null
          order_id: number | null
          risk_flag: Database["public"]["Enums"]["culture_risk_flag"]
          risk_flag_cleared_at: string | null
          risk_flag_reason: string | null
          risk_flag_set_at: string | null
          status: Database["public"]["Enums"]["culture_status"]
          tissue_source: string | null
          updated_at: string
        }
        Insert: {
          at_risk?: boolean | null
          at_risk_reason?: string | null
          at_risk_set_at?: string | null
          at_risk_set_by_user_id?: number | null
          cell_type: string
          created_at?: string
          created_by_user_id?: number | null
          culture_code: string
          culture_type?: Database["public"]["Enums"]["culture_type"] | null
          current_passage?: number
          donation_id: number
          id?: number
          initial_process_template_id?: number | null
          isolated_by_user_id?: number | null
          isolation_date?: string | null
          media_batch_used_id?: number | null
          order_id?: number | null
          risk_flag?: Database["public"]["Enums"]["culture_risk_flag"]
          risk_flag_cleared_at?: string | null
          risk_flag_reason?: string | null
          risk_flag_set_at?: string | null
          status?: Database["public"]["Enums"]["culture_status"]
          tissue_source?: string | null
          updated_at?: string
        }
        Update: {
          at_risk?: boolean | null
          at_risk_reason?: string | null
          at_risk_set_at?: string | null
          at_risk_set_by_user_id?: number | null
          cell_type?: string
          created_at?: string
          created_by_user_id?: number | null
          culture_code?: string
          culture_type?: Database["public"]["Enums"]["culture_type"] | null
          current_passage?: number
          donation_id?: number
          id?: number
          initial_process_template_id?: number | null
          isolated_by_user_id?: number | null
          isolation_date?: string | null
          media_batch_used_id?: number | null
          order_id?: number | null
          risk_flag?: Database["public"]["Enums"]["culture_risk_flag"]
          risk_flag_cleared_at?: string | null
          risk_flag_reason?: string | null
          risk_flag_set_at?: string | null
          status?: Database["public"]["Enums"]["culture_status"]
          tissue_source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultures_at_risk_set_by_user_id_fkey"
            columns: ["at_risk_set_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_initial_process_template_id_fkey"
            columns: ["initial_process_template_id"]
            isOneToOne: false
            referencedRelation: "process_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_isolated_by_user_id_fkey"
            columns: ["isolated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_media_batch_used_id_fkey"
            columns: ["media_batch_used_id"]
            isOneToOne: false
            referencedRelation: "combined_media_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultures_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      deviations: {
        Row: {
          container_id: number | null
          corrective_action: string | null
          created_at: string
          culture_id: number | null
          description: string
          detected_at: string
          detected_by_user_id: number
          deviation_code: string
          deviation_type: Database["public"]["Enums"]["deviation_type"]
          executed_step_container_result_id: number | null
          executed_step_id: number | null
          id: number
          preventive_action: string | null
          qp_notified_at: string | null
          qp_review_comments: string | null
          qp_review_decision: Database["public"]["Enums"]["qp_decision"] | null
          qp_review_required: boolean
          qp_reviewed_at: string | null
          qp_reviewed_by_user_id: number | null
          resolved_at: string | null
          resolved_by_user_id: number | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["deviation_severity"]
          status: Database["public"]["Enums"]["deviation_status"]
        }
        Insert: {
          container_id?: number | null
          corrective_action?: string | null
          created_at?: string
          culture_id?: number | null
          description: string
          detected_at?: string
          detected_by_user_id: number
          deviation_code: string
          deviation_type: Database["public"]["Enums"]["deviation_type"]
          executed_step_container_result_id?: number | null
          executed_step_id?: number | null
          id?: number
          preventive_action?: string | null
          qp_notified_at?: string | null
          qp_review_comments?: string | null
          qp_review_decision?: Database["public"]["Enums"]["qp_decision"] | null
          qp_review_required?: boolean
          qp_reviewed_at?: string | null
          qp_reviewed_by_user_id?: number | null
          resolved_at?: string | null
          resolved_by_user_id?: number | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["deviation_severity"]
          status?: Database["public"]["Enums"]["deviation_status"]
        }
        Update: {
          container_id?: number | null
          corrective_action?: string | null
          created_at?: string
          culture_id?: number | null
          description?: string
          detected_at?: string
          detected_by_user_id?: number
          deviation_code?: string
          deviation_type?: Database["public"]["Enums"]["deviation_type"]
          executed_step_container_result_id?: number | null
          executed_step_id?: number | null
          id?: number
          preventive_action?: string | null
          qp_notified_at?: string | null
          qp_review_comments?: string | null
          qp_review_decision?: Database["public"]["Enums"]["qp_decision"] | null
          qp_review_required?: boolean
          qp_reviewed_at?: string | null
          qp_reviewed_by_user_id?: number | null
          resolved_at?: string | null
          resolved_by_user_id?: number | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["deviation_severity"]
          status?: Database["public"]["Enums"]["deviation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deviations_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_detected_by_user_id_fkey"
            columns: ["detected_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_executed_step_container_result_id_fkey"
            columns: ["executed_step_container_result_id"]
            isOneToOne: false
            referencedRelation: "executed_step_container_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_executed_step_id_fkey"
            columns: ["executed_step_id"]
            isOneToOne: false
            referencedRelation: "executed_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_qp_reviewed_by_user_id_fkey"
            columns: ["qp_reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_qp_decisions: {
        Row: {
          conditions: string | null
          decided_at: string
          decided_by_user_id: number
          decision: string
          donation_id: number
          id: number
          reason: string
        }
        Insert: {
          conditions?: string | null
          decided_at?: string
          decided_by_user_id: number
          decision: string
          donation_id: number
          id?: number
          reason: string
        }
        Update: {
          conditions?: string | null
          decided_at?: string
          decided_by_user_id?: number
          decision?: string
          donation_id?: number
          id?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_qp_decisions_decided_by_user_id_fkey"
            columns: ["decided_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_qp_decisions_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          cell_type: string | null
          collection_method: string | null
          collection_site: string | null
          consent_confirmed: boolean
          consent_form_number: string | null
          contract_date: string | null
          contract_number: string | null
          created_at: string
          created_by_user_id: number | null
          donation_code: string
          donation_date: string
          donor_id: number
          id: number
          qp_verification_notes: string | null
          qp_verified: boolean
          qp_verified_at: string | null
          qp_verified_by_user_id: number | null
          serology_hbv: Database["public"]["Enums"]["serology_status"]
          serology_hcv: Database["public"]["Enums"]["serology_status"]
          serology_hiv: Database["public"]["Enums"]["serology_status"]
          serology_syphilis: Database["public"]["Enums"]["serology_status"]
          status: Database["public"]["Enums"]["donation_status"]
          tissue_type: string
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          cell_type?: string | null
          collection_method?: string | null
          collection_site?: string | null
          consent_confirmed?: boolean
          consent_form_number?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by_user_id?: number | null
          donation_code: string
          donation_date: string
          donor_id: number
          id?: number
          qp_verification_notes?: string | null
          qp_verified?: boolean
          qp_verified_at?: string | null
          qp_verified_by_user_id?: number | null
          serology_hbv?: Database["public"]["Enums"]["serology_status"]
          serology_hcv?: Database["public"]["Enums"]["serology_status"]
          serology_hiv?: Database["public"]["Enums"]["serology_status"]
          serology_syphilis?: Database["public"]["Enums"]["serology_status"]
          status?: Database["public"]["Enums"]["donation_status"]
          tissue_type: string
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          cell_type?: string | null
          collection_method?: string | null
          collection_site?: string | null
          consent_confirmed?: boolean
          consent_form_number?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by_user_id?: number | null
          donation_code?: string
          donation_date?: string
          donor_id?: number
          id?: number
          qp_verification_notes?: string | null
          qp_verified?: boolean
          qp_verified_at?: string | null
          qp_verified_by_user_id?: number | null
          serology_hbv?: Database["public"]["Enums"]["serology_status"]
          serology_hcv?: Database["public"]["Enums"]["serology_status"]
          serology_hiv?: Database["public"]["Enums"]["serology_status"]
          serology_syphilis?: Database["public"]["Enums"]["serology_status"]
          status?: Database["public"]["Enums"]["donation_status"]
          tissue_type?: string
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_qp_verified_by_user_id_fkey"
            columns: ["qp_verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: string | null
          allergies: string | null
          birth_date: string | null
          birth_year: number | null
          blood_type: string | null
          chronic_diseases: string | null
          consent_form_url: string | null
          created_at: string
          donor_code: string
          email: string | null
          ethnicity: string | null
          full_name: string | null
          health_notes: string | null
          id: number
          is_active: boolean
          medical_history: Json | null
          phone: string | null
          sex: Database["public"]["Enums"]["sex_type"] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          birth_year?: number | null
          blood_type?: string | null
          chronic_diseases?: string | null
          consent_form_url?: string | null
          created_at?: string
          donor_code: string
          email?: string | null
          ethnicity?: string | null
          full_name?: string | null
          health_notes?: string | null
          id?: number
          is_active?: boolean
          medical_history?: Json | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          birth_year?: number | null
          blood_type?: string | null
          chronic_diseases?: string | null
          consent_form_url?: string | null
          created_at?: string
          donor_code?: string
          email?: string | null
          ethnicity?: string | null
          full_name?: string | null
          health_notes?: string | null
          id?: number
          is_active?: boolean
          medical_history?: Json | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          barcode: string | null
          calibration_certificate: string | null
          calibration_due_date: string | null
          calibration_frequency_days: number | null
          calibration_valid_until: string | null
          created_at: string
          equipment_code: string
          equipment_name: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: number
          last_calibration_date: string | null
          location_id: number | null
          maintenance_notes: string | null
          manufacturer: string | null
          model: string | null
          qr_code_data: Json | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          calibration_certificate?: string | null
          calibration_due_date?: string | null
          calibration_frequency_days?: number | null
          calibration_valid_until?: string | null
          created_at?: string
          equipment_code: string
          equipment_name: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: number
          last_calibration_date?: string | null
          location_id?: number | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          qr_code_data?: Json | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          calibration_certificate?: string | null
          calibration_due_date?: string | null
          calibration_frequency_days?: number | null
          calibration_valid_until?: string | null
          created_at?: string
          equipment_code?: string
          equipment_name?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: number
          last_calibration_date?: string | null
          location_id?: number | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          qr_code_data?: Json | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      executed_processes: {
        Row: {
          completed_at: string | null
          container_ids: Json | null
          created_at: string
          culture_id: number
          id: number
          process_code: string
          process_template_id: number
          session_id: number | null
          started_at: string
          started_by_user_id: number
          status: Database["public"]["Enums"]["process_status"]
        }
        Insert: {
          completed_at?: string | null
          container_ids?: Json | null
          created_at?: string
          culture_id: number
          id?: number
          process_code: string
          process_template_id: number
          session_id?: number | null
          started_at?: string
          started_by_user_id: number
          status?: Database["public"]["Enums"]["process_status"]
        }
        Update: {
          completed_at?: string | null
          container_ids?: Json | null
          created_at?: string
          culture_id?: number
          id?: number
          process_code?: string
          process_template_id?: number
          session_id?: number | null
          started_at?: string
          started_by_user_id?: number
          status?: Database["public"]["Enums"]["process_status"]
        }
        Relationships: [
          {
            foreignKeyName: "executed_processes_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_processes_process_template_id_fkey"
            columns: ["process_template_id"]
            isOneToOne: false
            referencedRelation: "process_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_processes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_processes_started_by_user_id_fkey"
            columns: ["started_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      executed_step_container_results: {
        Row: {
          cca_passed: boolean | null
          cca_results: Json | null
          completed_at: string | null
          completed_by_user_id: number | null
          container_id: number
          created_at: string
          created_by_user_id: number | null
          executed_step_id: number
          id: number
          recorded_parameters: Json | null
          status: Database["public"]["Enums"]["step_result_status"]
        }
        Insert: {
          cca_passed?: boolean | null
          cca_results?: Json | null
          completed_at?: string | null
          completed_by_user_id?: number | null
          container_id: number
          created_at?: string
          created_by_user_id?: number | null
          executed_step_id: number
          id?: number
          recorded_parameters?: Json | null
          status?: Database["public"]["Enums"]["step_result_status"]
        }
        Update: {
          cca_passed?: boolean | null
          cca_results?: Json | null
          completed_at?: string | null
          completed_by_user_id?: number | null
          container_id?: number
          created_at?: string
          created_by_user_id?: number | null
          executed_step_id?: number
          id?: number
          recorded_parameters?: Json | null
          status?: Database["public"]["Enums"]["step_result_status"]
        }
        Relationships: [
          {
            foreignKeyName: "executed_step_container_results_completed_by_user_id_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_step_container_results_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_step_container_results_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_step_container_results_executed_step_id_fkey"
            columns: ["executed_step_id"]
            isOneToOne: false
            referencedRelation: "executed_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      executed_steps: {
        Row: {
          cca_passed: boolean | null
          cca_results: Json | null
          completed_at: string | null
          container_id: number | null
          created_at: string
          equipment_scan_timestamp: string | null
          executed_by_user_id: number | null
          executed_process_id: number
          id: number
          media_batch_used_id: number | null
          notes: string | null
          process_template_step_id: number
          recorded_parameters: Json | null
          scanned_equipment_id: number | null
          sop_confirmed_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
        }
        Insert: {
          cca_passed?: boolean | null
          cca_results?: Json | null
          completed_at?: string | null
          container_id?: number | null
          created_at?: string
          equipment_scan_timestamp?: string | null
          executed_by_user_id?: number | null
          executed_process_id: number
          id?: number
          media_batch_used_id?: number | null
          notes?: string | null
          process_template_step_id: number
          recorded_parameters?: Json | null
          scanned_equipment_id?: number | null
          sop_confirmed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
        }
        Update: {
          cca_passed?: boolean | null
          cca_results?: Json | null
          completed_at?: string | null
          container_id?: number | null
          created_at?: string
          equipment_scan_timestamp?: string | null
          executed_by_user_id?: number | null
          executed_process_id?: number
          id?: number
          media_batch_used_id?: number | null
          notes?: string | null
          process_template_step_id?: number
          recorded_parameters?: Json | null
          scanned_equipment_id?: number | null
          sop_confirmed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
        }
        Relationships: [
          {
            foreignKeyName: "executed_steps_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_steps_executed_by_user_id_fkey"
            columns: ["executed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_steps_executed_process_id_fkey"
            columns: ["executed_process_id"]
            isOneToOne: false
            referencedRelation: "executed_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_steps_media_batch_used_id_fkey"
            columns: ["media_batch_used_id"]
            isOneToOne: false
            referencedRelation: "combined_media_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_steps_process_template_step_id_fkey"
            columns: ["process_template_step_id"]
            isOneToOne: false
            referencedRelation: "process_template_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executed_steps_scanned_equipment_id_fkey"
            columns: ["scanned_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          batch_code: string | null
          catalog_number: string | null
          certificate_of_analysis_url: string | null
          created_at: string
          equipment_id: number | null
          expiry_date: string
          id: number
          item_category: Database["public"]["Enums"]["inventory_category"]
          item_code: string
          item_name: string
          item_type: string | null
          lot_number: string | null
          qc_status: Database["public"]["Enums"]["qc_status"]
          quantity: number
          quantity_remaining: number
          receipt_date: string
          status: Database["public"]["Enums"]["inventory_status"]
          storage_conditions: string | null
          storage_location_id: number | null
          storage_zone_id: number | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          catalog_number?: string | null
          certificate_of_analysis_url?: string | null
          created_at?: string
          equipment_id?: number | null
          expiry_date: string
          id?: number
          item_category: Database["public"]["Enums"]["inventory_category"]
          item_code: string
          item_name: string
          item_type?: string | null
          lot_number?: string | null
          qc_status?: Database["public"]["Enums"]["qc_status"]
          quantity: number
          quantity_remaining: number
          receipt_date: string
          status?: Database["public"]["Enums"]["inventory_status"]
          storage_conditions?: string | null
          storage_location_id?: number | null
          storage_zone_id?: number | null
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          catalog_number?: string | null
          certificate_of_analysis_url?: string | null
          created_at?: string
          equipment_id?: number | null
          expiry_date?: string
          id?: number
          item_category?: Database["public"]["Enums"]["inventory_category"]
          item_code?: string
          item_name?: string
          item_type?: string | null
          lot_number?: string | null
          qc_status?: Database["public"]["Enums"]["qc_status"]
          quantity?: number
          quantity_remaining?: number
          receipt_date?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          storage_conditions?: string | null
          storage_location_id?: number | null
          storage_zone_id?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_storage_zone_id_fkey"
            columns: ["storage_zone_id"]
            isOneToOne: false
            referencedRelation: "storage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          combined_media_batch_id: number | null
          created_at: string
          executed_step_id: number | null
          id: number
          inventory_item_id: number
          performed_by_user_id: number | null
          quantity: number
          reason: string | null
          timestamp: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit: string
        }
        Insert: {
          combined_media_batch_id?: number | null
          created_at?: string
          executed_step_id?: number | null
          id?: number
          inventory_item_id: number
          performed_by_user_id?: number | null
          quantity: number
          reason?: string | null
          timestamp?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit: string
        }
        Update: {
          combined_media_batch_id?: number | null
          created_at?: string
          executed_step_id?: number | null
          id?: number
          inventory_item_id?: number
          performed_by_user_id?: number | null
          quantity?: number
          reason?: string | null
          timestamp?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inv_trans_step"
            columns: ["executed_step_id"]
            isOneToOne: false
            referencedRelation: "executed_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_combined_media_batch_id_fkey"
            columns: ["combined_media_batch_id"]
            isOneToOne: false
            referencedRelation: "combined_media_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          capacity: number | null
          clean_room_class: string | null
          created_at: string
          current_occupancy: number
          id: number
          is_clean_room: boolean
          location_code: string
          location_name: string
          location_type: Database["public"]["Enums"]["location_type"]
          parent_location_id: number | null
          status: Database["public"]["Enums"]["location_status"]
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          clean_room_class?: string | null
          created_at?: string
          current_occupancy?: number
          id?: number
          is_clean_room?: boolean
          location_code: string
          location_name: string
          location_type: Database["public"]["Enums"]["location_type"]
          parent_location_id?: number | null
          status?: Database["public"]["Enums"]["location_status"]
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          clean_room_class?: string | null
          created_at?: string
          current_occupancy?: number
          id?: number
          is_clean_room?: boolean
          location_code?: string
          location_name?: string
          location_type?: Database["public"]["Enums"]["location_type"]
          parent_location_id?: number | null
          status?: Database["public"]["Enums"]["location_status"]
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_component_batches: {
        Row: {
          batch_code: string
          component_name: string
          created_at: string
          expiry_date: string
          id: number
          inventory_item_id: number
          lot_number: string | null
          quantity_remaining: number
          status: Database["public"]["Enums"]["media_batch_status"]
          unit: string
        }
        Insert: {
          batch_code: string
          component_name: string
          created_at?: string
          expiry_date: string
          id?: number
          inventory_item_id: number
          lot_number?: string | null
          quantity_remaining: number
          status?: Database["public"]["Enums"]["media_batch_status"]
          unit: string
        }
        Update: {
          batch_code?: string
          component_name?: string
          created_at?: string
          expiry_date?: string
          id?: number
          inventory_item_id?: number
          lot_number?: string | null
          quantity_remaining?: number
          status?: Database["public"]["Enums"]["media_batch_status"]
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_component_batches_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_recipe_components: {
        Row: {
          component_name: string
          component_type: Database["public"]["Enums"]["component_type"]
          created_at: string
          id: number
          is_optional: boolean
          media_recipe_id: number
          notes: string | null
          quantity_per_liter: number | null
          quantity_percent: number | null
          unit: string
        }
        Insert: {
          component_name: string
          component_type: Database["public"]["Enums"]["component_type"]
          created_at?: string
          id?: number
          is_optional?: boolean
          media_recipe_id: number
          notes?: string | null
          quantity_per_liter?: number | null
          quantity_percent?: number | null
          unit: string
        }
        Update: {
          component_name?: string
          component_type?: Database["public"]["Enums"]["component_type"]
          created_at?: string
          id?: number
          is_optional?: boolean
          media_recipe_id?: number
          notes?: string | null
          quantity_per_liter?: number | null
          quantity_percent?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_recipe_components_media_recipe_id_fkey"
            columns: ["media_recipe_id"]
            isOneToOne: false
            referencedRelation: "media_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      media_recipes: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          preparation_sop_reference: string | null
          recipe_code: string
          recipe_name: string
          recipe_type: Database["public"]["Enums"]["media_recipe_type"]
          shelf_life_days: number
          storage_conditions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          preparation_sop_reference?: string | null
          recipe_code: string
          recipe_name: string
          recipe_type?: Database["public"]["Enums"]["media_recipe_type"]
          shelf_life_days?: number
          storage_conditions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          preparation_sop_reference?: string | null
          recipe_code?: string
          recipe_name?: string
          recipe_type?: Database["public"]["Enums"]["media_recipe_type"]
          shelf_life_days?: number
          storage_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          message: string | null
          notification_type: string
          priority: string | null
          read: boolean | null
          read_at: string | null
          related_entity_id: number | null
          related_entity_type: string | null
          title: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          message?: string | null
          notification_type: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          title: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string | null
          notification_type?: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          title?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          confluence_percent: number | null
          container_id: number | null
          contamination_detected: boolean | null
          contamination_type: string | null
          created_at: string | null
          culture_id: number
          id: number
          images: Json | null
          morphology_description: string | null
          notes: string | null
          observation_date: string
          recorded_by_user_id: number | null
          updated_at: string | null
        }
        Insert: {
          confluence_percent?: number | null
          container_id?: number | null
          contamination_detected?: boolean | null
          contamination_type?: string | null
          created_at?: string | null
          culture_id: number
          id?: number
          images?: Json | null
          morphology_description?: string | null
          notes?: string | null
          observation_date?: string
          recorded_by_user_id?: number | null
          updated_at?: string | null
        }
        Update: {
          confluence_percent?: number | null
          container_id?: number | null
          contamination_detected?: boolean | null
          contamination_type?: string | null
          created_at?: string | null
          culture_id?: number
          id?: number
          images?: Json | null
          morphology_description?: string | null
          notes?: string | null
          observation_date?: string
          recorded_by_user_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_recorded_by_user_id_fkey"
            columns: ["recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cell_type_required: string
          client_contact: Json | null
          client_name: string
          created_at: string
          delivery_date_target: string | null
          id: number
          order_code: string
          priority: Database["public"]["Enums"]["order_priority"]
          quantity_required: number
          special_requirements: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          cell_type_required: string
          client_contact?: Json | null
          client_name: string
          created_at?: string
          delivery_date_target?: string | null
          id?: number
          order_code: string
          priority?: Database["public"]["Enums"]["order_priority"]
          quantity_required: number
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          cell_type_required?: string
          client_contact?: Json | null
          client_name?: string
          created_at?: string
          delivery_date_target?: string | null
          id?: number
          order_code?: string
          priority?: Database["public"]["Enums"]["order_priority"]
          quantity_required?: number
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: []
      }
      process_template_steps: {
        Row: {
          cca_rules: Json | null
          created_at: string
          description: string | null
          expected_duration_minutes: number | null
          expected_equipment_id: number | null
          id: number
          is_critical: boolean
          process_template_id: number
          required_parameters: Json | null
          requires_equipment_scan: boolean
          requires_sop_confirmation: boolean
          sop_id: number | null
          sop_reference: string | null
          step_name: string
          step_number: number
          step_type: Database["public"]["Enums"]["step_type"]
        }
        Insert: {
          cca_rules?: Json | null
          created_at?: string
          description?: string | null
          expected_duration_minutes?: number | null
          expected_equipment_id?: number | null
          id?: number
          is_critical?: boolean
          process_template_id: number
          required_parameters?: Json | null
          requires_equipment_scan?: boolean
          requires_sop_confirmation?: boolean
          sop_id?: number | null
          sop_reference?: string | null
          step_name: string
          step_number: number
          step_type: Database["public"]["Enums"]["step_type"]
        }
        Update: {
          cca_rules?: Json | null
          created_at?: string
          description?: string | null
          expected_duration_minutes?: number | null
          expected_equipment_id?: number | null
          id?: number
          is_critical?: boolean
          process_template_id?: number
          required_parameters?: Json | null
          requires_equipment_scan?: boolean
          requires_sop_confirmation?: boolean
          sop_id?: number | null
          sop_reference?: string | null
          step_name?: string
          step_number?: number
          step_type?: Database["public"]["Enums"]["step_type"]
        }
        Relationships: [
          {
            foreignKeyName: "process_template_steps_expected_equipment_id_fkey"
            columns: ["expected_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_steps_process_template_id_fkey"
            columns: ["process_template_id"]
            isOneToOne: false
            referencedRelation: "process_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_template_steps_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      process_templates: {
        Row: {
          applicable_cell_types: Json | null
          applicable_tissue_types: Json | null
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: number
          is_active: boolean
          is_universal: boolean | null
          name: string
          requires_clean_room: boolean
          sop_document_url: string | null
          template_code: string
          updated_at: string
          version: string
        }
        Insert: {
          applicable_cell_types?: Json | null
          applicable_tissue_types?: Json | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_active?: boolean
          is_universal?: boolean | null
          name: string
          requires_clean_room?: boolean
          sop_document_url?: string | null
          template_code: string
          updated_at?: string
          version?: string
        }
        Update: {
          applicable_cell_types?: Json | null
          applicable_tissue_types?: Json | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_active?: boolean
          is_universal?: boolean | null
          name?: string
          requires_clean_room?: boolean
          sop_document_url?: string | null
          template_code?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      qc_tests: {
        Row: {
          certificate_url: string | null
          container_id: number | null
          created_at: string
          culture_id: number
          id: number
          performed_at: string | null
          performed_by_user_id: number | null
          requested_at: string
          requested_by_user_id: number
          result_notes: string | null
          result_status: Database["public"]["Enums"]["qc_result_status"]
          result_value: string | null
          test_code: string
          test_method: string | null
          test_type: Database["public"]["Enums"]["qc_test_type"]
        }
        Insert: {
          certificate_url?: string | null
          container_id?: number | null
          created_at?: string
          culture_id: number
          id?: number
          performed_at?: string | null
          performed_by_user_id?: number | null
          requested_at?: string
          requested_by_user_id: number
          result_notes?: string | null
          result_status?: Database["public"]["Enums"]["qc_result_status"]
          result_value?: string | null
          test_code: string
          test_method?: string | null
          test_type: Database["public"]["Enums"]["qc_test_type"]
        }
        Update: {
          certificate_url?: string | null
          container_id?: number | null
          created_at?: string
          culture_id?: number
          id?: number
          performed_at?: string | null
          performed_by_user_id?: number | null
          requested_at?: string
          requested_by_user_id?: number
          result_notes?: string | null
          result_status?: Database["public"]["Enums"]["qc_result_status"]
          result_value?: string | null
          test_code?: string
          test_method?: string | null
          test_type?: Database["public"]["Enums"]["qc_test_type"]
        }
        Relationships: [
          {
            foreignKeyName: "qc_tests_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_tests_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_tests_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_tests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          certificate_of_analysis_url: string | null
          container_ids: Json | null
          created_at: string
          culture_id: number
          id: number
          order_id: number
          qp_approved_at: string | null
          qp_approved_by_user_id: number | null
          recipient_signature_url: string | null
          release_code: string
          release_date: string | null
          shipping_conditions: Json | null
          status: Database["public"]["Enums"]["release_status"]
        }
        Insert: {
          certificate_of_analysis_url?: string | null
          container_ids?: Json | null
          created_at?: string
          culture_id: number
          id?: number
          order_id: number
          qp_approved_at?: string | null
          qp_approved_by_user_id?: number | null
          recipient_signature_url?: string | null
          release_code: string
          release_date?: string | null
          shipping_conditions?: Json | null
          status?: Database["public"]["Enums"]["release_status"]
        }
        Update: {
          certificate_of_analysis_url?: string | null
          container_ids?: Json | null
          created_at?: string
          culture_id?: number
          id?: number
          order_id?: number
          qp_approved_at?: string | null
          qp_approved_by_user_id?: number | null
          recipient_signature_url?: string | null
          release_code?: string
          release_date?: string | null
          shipping_conditions?: Json | null
          status?: Database["public"]["Enums"]["release_status"]
        }
        Relationships: [
          {
            foreignKeyName: "releases_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releases_qp_approved_by_user_id_fkey"
            columns: ["qp_approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      serology_tests: {
        Row: {
          created_at: string | null
          donation_id: number
          id: number
          lab_number: string | null
          performed_by_user_id: number | null
          protocol_file_url: string | null
          reference_values: string | null
          result: string
          test_date: string
          test_type: string
        }
        Insert: {
          created_at?: string | null
          donation_id: number
          id?: number
          lab_number?: string | null
          performed_by_user_id?: number | null
          protocol_file_url?: string | null
          reference_values?: string | null
          result: string
          test_date: string
          test_type: string
        }
        Update: {
          created_at?: string | null
          donation_id?: number
          id?: number
          lab_number?: string | null
          performed_by_user_id?: number | null
          protocol_file_url?: string | null
          reference_values?: string | null
          result?: string
          test_date?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "serology_tests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serology_tests_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          cultures_processed: Json | null
          id: number
          location_id: number | null
          notes: string | null
          session_code: string
          session_type: Database["public"]["Enums"]["session_type"]
          started_at: string
          started_by_user_id: number
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cultures_processed?: Json | null
          id?: number
          location_id?: number | null
          notes?: string | null
          session_code: string
          session_type: Database["public"]["Enums"]["session_type"]
          started_at?: string
          started_by_user_id: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cultures_processed?: Json | null
          id?: number
          location_id?: number | null
          notes?: string | null
          session_code?: string
          session_type?: Database["public"]["Enums"]["session_type"]
          started_at?: string
          started_by_user_id?: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_started_by_user_id_fkey"
            columns: ["started_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_versions: {
        Row: {
          approved_at: string | null
          approved_by_user_id: number | null
          content_snapshot: Json
          created_at: string | null
          effective_from: string
          effective_to: string | null
          id: number
          sop_id: number | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: number | null
          content_snapshot: Json
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: number
          sop_id?: number | null
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: number | null
          content_snapshot?: Json
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: number
          sop_id?: number | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_versions_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_versions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          created_at: string
          created_by_user_id: number | null
          description: string | null
          document_url: string | null
          effective_date: string | null
          id: number
          is_active: boolean
          review_date: string | null
          sop_code: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: number | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          id?: number
          is_active?: boolean
          review_date?: string | null
          sop_code: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: number | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          id?: number
          is_active?: boolean
          review_date?: string | null
          sop_code?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "sops_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_zones: {
        Row: {
          capacity: number
          created_at: string | null
          current_occupancy: number
          equipment_id: number | null
          id: number
          position: string | null
          status: string
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string | null
          zone_code: string
          zone_name: string
          zone_type: string
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          current_occupancy?: number
          equipment_id?: number | null
          id?: number
          position?: string | null
          status?: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          zone_code: string
          zone_name: string
          zone_type?: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          current_occupancy?: number
          equipment_id?: number | null
          id?: number
          position?: string | null
          status?: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          zone_code?: string
          zone_name?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_zones_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_role: string | null
          assigned_to_user_id: number | null
          completed_at: string | null
          completed_by_user_id: number | null
          container_id: number | null
          created_at: string | null
          culture_id: number | null
          description: string | null
          deviation_id: number | null
          due_date: string | null
          id: number
          notes: string | null
          priority: string | null
          related_entity_id: number | null
          related_entity_type: string | null
          status: string | null
          task_code: string
          task_type: string
          title: string
        }
        Insert: {
          assigned_to_role?: string | null
          assigned_to_user_id?: number | null
          completed_at?: string | null
          completed_by_user_id?: number | null
          container_id?: number | null
          created_at?: string | null
          culture_id?: number | null
          description?: string | null
          deviation_id?: number | null
          due_date?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          status?: string | null
          task_code: string
          task_type: string
          title: string
        }
        Update: {
          assigned_to_role?: string | null
          assigned_to_user_id?: number | null
          completed_at?: string | null
          completed_by_user_id?: number | null
          container_id?: number | null
          created_at?: string | null
          culture_id?: number | null
          description?: string | null
          deviation_id?: number | null
          due_date?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          status?: string | null
          task_code?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_user_id_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deviation_id_fkey"
            columns: ["deviation_id"]
            isOneToOne: false
            referencedRelation: "deviations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          created_at: string
          id: number
          notification_preferences: Json | null
          notifications_enabled: boolean
          telegram_id: number
          telegram_username: string | null
          updated_at: string
          user_id: number
          verification_code: string | null
          verification_sent_at: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: number
          notification_preferences?: Json | null
          notifications_enabled?: boolean
          telegram_id: number
          telegram_username?: string | null
          updated_at?: string
          user_id: number
          verification_code?: string | null
          verification_sent_at?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: number
          notification_preferences?: Json | null
          notifications_enabled?: boolean
          telegram_id?: number
          telegram_username?: string | null
          updated_at?: string
          user_id?: number
          verification_code?: string | null
          verification_sent_at?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "telegram_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: number
          notifications_enabled: boolean | null
          telegram_chat_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: number
          notifications_enabled?: boolean | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: number
          notifications_enabled?: boolean | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: number
          is_active: boolean
          last_login_at: string | null
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          telegram_chat_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_chat_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_chat_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_container_code: {
        Args: {
          p_container_type_code: string
          p_culture_code: string
          p_passage: number
          p_split_index: number
        }
        Returns: string
      }
      generate_culture_code: { Args: never; Returns: string }
      generate_deviation_code: { Args: never; Returns: string }
      generate_donation_code: { Args: never; Returns: string }
      generate_donor_code: { Args: never; Returns: string }
      generate_inventory_code: { Args: never; Returns: string }
      generate_media_batch_code: { Args: never; Returns: string }
      generate_order_code: { Args: never; Returns: string }
      generate_process_code: { Args: never; Returns: string }
      generate_qc_test_code: { Args: never; Returns: string }
      generate_release_code: { Args: never; Returns: string }
      generate_session_code: { Args: never; Returns: string }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "approve"
        | "reject"
        | "print"
        | "export"
      component_type:
        | "base_medium"
        | "serum"
        | "antibiotic"
        | "growth_factor"
        | "supplement"
      container_category: "flask" | "plate" | "cryovial" | "bag" | "bioreactor"
      container_quality_hold: "none" | "system" | "qp"
      container_status: "active" | "frozen" | "thawed" | "disposed" | "blocked"
      culture_risk_flag: "none" | "at_risk" | "critical"
      culture_status: "active" | "frozen" | "hold" | "contaminated" | "disposed"
      culture_type: "primary" | "passage" | "mcb" | "wcb"
      deviation_severity: "minor" | "major" | "critical"
      deviation_status: "open" | "under_review" | "resolved" | "escalated"
      deviation_type:
        | "cca_fail"
        | "contamination"
        | "process_violation"
        | "equipment_failure"
        | "other"
      donation_status: "received" | "processing" | "approved" | "rejected"
      equipment_status:
        | "operational"
        | "maintenance"
        | "calibration_due"
        | "retired"
      equipment_type:
        | "incubator"
        | "laminar_hood"
        | "centrifuge"
        | "microscope"
        | "freezer"
        | "other"
      inventory_category:
        | "media"
        | "serum"
        | "reagent"
        | "consumable"
        | "additive"
      inventory_status:
        | "active"
        | "quarantined"
        | "expired"
        | "depleted"
        | "disposed"
      location_status: "active" | "maintenance" | "restricted"
      location_type:
        | "room"
        | "incubator"
        | "freezer"
        | "refrigerator"
        | "shelf"
        | "rack"
      media_batch_status:
        | "active"
        | "quarantined"
        | "expired"
        | "depleted"
        | "disposed"
      media_recipe_type: "base" | "combined"
      order_priority: "standard" | "urgent" | "critical"
      order_status:
        | "received"
        | "in_production"
        | "qc_pending"
        | "ready"
        | "shipped"
        | "cancelled"
      process_status:
        | "in_progress"
        | "completed"
        | "paused"
        | "aborted"
        | "paused_quality_hold"
      qc_result_status:
        | "pending"
        | "in_progress"
        | "passed"
        | "failed"
        | "inconclusive"
      qc_status: "pending" | "passed" | "failed"
      qc_test_type:
        | "sterility"
        | "mycoplasma"
        | "endotoxin"
        | "viability"
        | "identity"
        | "potency"
      qp_decision: "continue" | "quarantine" | "dispose"
      release_status:
        | "pending_qp"
        | "approved"
        | "shipped"
        | "delivered"
        | "rejected"
      serology_status: "negative" | "positive" | "pending"
      session_status: "in_progress" | "completed" | "aborted"
      session_type: "passage" | "thawing" | "freezing" | "qc_sampling" | "other"
      sex_type: "male" | "female" | "other"
      step_result_status: "draft" | "completed" | "failed_cca" | "voided"
      step_status: "pending" | "in_progress" | "completed" | "failed"
      step_type: "measurement" | "manipulation" | "incubation" | "observation" | "passage" | "cell_counting" | "media_change" | "banking"
      sterility_status: "pending" | "passed" | "failed"
      transaction_type:
        | "receipt"
        | "usage"
        | "disposal"
        | "adjustment"
        | "quarantine"
      user_role: "admin" | "qp" | "qc" | "operator" | "viewer"
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
      audit_action: [
        "create",
        "update",
        "delete",
        "approve",
        "reject",
        "print",
        "export",
      ],
      component_type: [
        "base_medium",
        "serum",
        "antibiotic",
        "growth_factor",
        "supplement",
      ],
      container_category: ["flask", "plate", "cryovial", "bag", "bioreactor"],
      container_quality_hold: ["none", "system", "qp"],
      container_status: ["active", "frozen", "thawed", "disposed", "blocked"],
      culture_risk_flag: ["none", "at_risk", "critical"],
      culture_status: ["active", "frozen", "hold", "contaminated", "disposed"],
      culture_type: ["primary", "passage", "mcb", "wcb"],
      deviation_severity: ["minor", "major", "critical"],
      deviation_status: ["open", "under_review", "resolved", "escalated"],
      deviation_type: [
        "cca_fail",
        "contamination",
        "process_violation",
        "equipment_failure",
        "other",
      ],
      donation_status: ["received", "processing", "approved", "rejected"],
      equipment_status: [
        "operational",
        "maintenance",
        "calibration_due",
        "retired",
      ],
      equipment_type: [
        "incubator",
        "laminar_hood",
        "centrifuge",
        "microscope",
        "freezer",
        "other",
      ],
      inventory_category: [
        "media",
        "serum",
        "reagent",
        "consumable",
        "additive",
      ],
      inventory_status: [
        "active",
        "quarantined",
        "expired",
        "depleted",
        "disposed",
      ],
      location_status: ["active", "maintenance", "restricted"],
      location_type: [
        "room",
        "incubator",
        "freezer",
        "refrigerator",
        "shelf",
        "rack",
      ],
      media_batch_status: [
        "active",
        "quarantined",
        "expired",
        "depleted",
        "disposed",
      ],
      media_recipe_type: ["base", "combined"],
      order_priority: ["standard", "urgent", "critical"],
      order_status: [
        "received",
        "in_production",
        "qc_pending",
        "ready",
        "shipped",
        "cancelled",
      ],
      process_status: [
        "in_progress",
        "completed",
        "paused",
        "aborted",
        "paused_quality_hold",
      ],
      qc_result_status: [
        "pending",
        "in_progress",
        "passed",
        "failed",
        "inconclusive",
      ],
      qc_status: ["pending", "passed", "failed"],
      qc_test_type: [
        "sterility",
        "mycoplasma",
        "endotoxin",
        "viability",
        "identity",
        "potency",
      ],
      qp_decision: ["continue", "quarantine", "dispose"],
      release_status: [
        "pending_qp",
        "approved",
        "shipped",
        "delivered",
        "rejected",
      ],
      serology_status: ["negative", "positive", "pending"],
      session_status: ["in_progress", "completed", "aborted"],
      session_type: ["passage", "thawing", "freezing", "qc_sampling", "other"],
      sex_type: ["male", "female", "other"],
      step_result_status: ["draft", "completed", "failed_cca", "voided"],
      step_status: ["pending", "in_progress", "completed", "failed"],
      step_type: ["measurement", "manipulation", "incubation", "observation", "passage", "cell_counting", "media_change", "banking"],
      sterility_status: ["pending", "passed", "failed"],
      transaction_type: [
        "receipt",
        "usage",
        "disposal",
        "adjustment",
        "quarantine",
      ],
      user_role: ["admin", "qp", "qc", "operator", "viewer"],
    },
  },
} as const
