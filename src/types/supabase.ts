export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string
          full_name: string
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username: string
          full_name: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 