// blog.js — minimal client + helpers for the blog
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 🔧 Your Supabase project (you shared these)
const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"

// Create client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/**
 * Fetch all posts with sensible ordering.
 * Tries published_at first, then created_at, then id.
 * Returns only fields the page uses.
 */
export async function fetchPosts() {
  // Select commonly-used columns; add/remove as you like
  const columns = [
    "id",
    "slug",
    "title",
    "description",
    "main_image_url",
    "published_at",
    "created_at",
    "updated_at"
  ].join(", ")

  let query = supabase.from("posts").select(columns)

  // Order by date fields if they exist; fall back to id
  query = query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at",  { ascending: false, nullsFirst: false })
    .order("id",          { ascending: false })

  const { data, error } = await query
  return { data, error }
}

/**
 * Inject header.html and footer.html into #header / #footer.
 * Keeps your HTML pages tidy and DRY.
 */
export async function includePartials({ headerSel = "#header", footerSel = "#footer" } = {}) {
  try {
    const [header, footer] = await Promise.all([
      fetch("header.html").then(r => r.ok ? r.text() : ""),
      fetch("footer.html").then(r => r.ok ? r.text() : "")
    ])
    const headerEl = document.querySelector(headerSel)
    const footerEl = document.querySelector(footerSel)
    if (headerEl) headerEl.innerHTML = header
    if (footerEl) footerEl.innerHTML = footer
  } catch (err) {
    console.error("Error loading partials:", err)
  }
}
