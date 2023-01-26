export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      identities: {
        Row: {
          key: string
          name: string
        }
        Insert: {
          key: string
          name: string
        }
        Update: {
          key?: string
          name?: string
        }
      }
      messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room?: string
        }
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
