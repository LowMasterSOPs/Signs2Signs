// blog.js — minimal “just show posts”
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Your project creds
const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/** Get every row from public.posts — newest first by id */
export async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, description, main_image_url")
    .order("id", { ascending: false })

  return { data, error }
}
