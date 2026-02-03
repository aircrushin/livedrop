export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          created_at: string;
          host_id: string;
          name: string;
          slug: string;
          qr_code_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          host_id: string;
          name: string;
          slug: string;
          qr_code_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          host_id?: string;
          name?: string;
          slug?: string;
          qr_code_url?: string | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          created_at: string;
          event_id: string;
          user_id: string;
          storage_path: string;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_id: string;
          user_id: string;
          storage_path: string;
          is_visible?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_id?: string;
          user_id?: string;
          storage_path?: string;
          is_visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Photo = Database["public"]["Tables"]["photos"]["Row"];
