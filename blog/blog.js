// /blog/blog.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// --- Supabase client ---
const supabaseUrl = "https://ketluxsokzvlqozcdwxo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"

export const supabase = createClient(supabaseUrl, supabaseKey)

// --- Header & Footer include ---
export async function includePartials() {
  async function include(file, target) {
    try {
      const res = await fetch(file, { cache: "no-store" })
      if (!res.ok) throw new Error(res.status + " " + res.statusText)
      document.getElementById(target).innerHTML = await res.text()
    } catch (err) {
      console.error("Include failed:", file, err)
      const el = document.getElementById(target)
      if (el) el.innerHTML = `<div style="padding:12px;color:#fca5a5;background:#1f2937;border-radius:8px;">Failed to load ${file}</div>`
    }
  }

  // if header.html/footer.html live at root, keep as /header.html
  // if they’re one level up, use ../header.html
  await include("/header.html", "header")
  await include("/footer.html", "footer")
}

// --- Fetch posts ---
export async function fetchPosts({ sort = "new", tag = null } = {}) {
  let query = supabase.from("post_stats").select("*").eq("status", "published")

  if (tag) {
    query = query.in(
      "id",
      supabase.from("post_tags").select("post_id", { count: "exact" }).eq("tag_id", tag)
    )
  }

  if (sort === "new") query = query.order("published_at", { ascending: false })
  if (sort === "views") query = query.order("views_count", { ascending: false })
  if (sort === "likes") query = query.order("likes_count", { ascending: false })

  return await query
}

// --- Fetch tags ---
export async function fetchTags() {
  const { data, error } = await supabase.from("tags").select("name")
  if (error) {
    console.error("Tag fetch error:", error)
    return []
  }
  return data.map(t => t.name)
}

// --- Single post (by slug) ---
export async function fetchPost(slug) {
  const { data, error } = await supabase
    .from("post_stats")
    .select("*, post_images(*), post_tags(tags(*))")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Post fetch error:", error)
    return null
  }
  return data
}

// --- Analytics: add view ---
export async function addView(postId) {
  return await supabase.from("post_views").insert([{ post_id: postId }])
}

// --- Analytics: toggle like ---
export async function toggleLike(postId) {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from("post_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("session_id", sessionId)
    .maybeSingle()

  if (data) {
    await supabase.from("post_likes").delete().match({ post_id: postId, session_id: sessionId })
    return { liked: false }
  } else {
    await supabase.from("post_likes").insert([{ post_id: postId, session_id: sessionId }])
    return { liked: true }
  }
}

// --- Session helper ---
function getSessionId() {
  let sid = localStorage.getItem("blog_session_id")
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem("blog_session_id", sid)
  }
  return sid
}
