// post.js — render a single blog post
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Supabase client
const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Load header/footer
async function includePartials({ headerSel="#header", footerSel="#footer" }={}) {
  try {
    const [header, footer] = await Promise.all([
      fetch("header.html").then(r => r.ok ? r.text() : ""),
      fetch("footer.html").then(r => r.ok ? r.text() : "")
    ])
    if (document.querySelector(headerSel)) document.querySelector(headerSel).innerHTML = header
    if (document.querySelector(footerSel)) document.querySelector(footerSel).innerHTML = footer
  } catch (err) {
    console.error("partials load error", err)
  }
}

// Grab slug from URL
function getSlug() {
  const params = new URLSearchParams(window.location.search)
  return params.get("slug")
}

// Fetch single post by slug or id
async function fetchPost(slug) {
  if(/^\d+$/.test(slug)){
    return supabase.from("posts").select("*").eq("id", slug).single()
  } else {
    return supabase.from("posts").select("*").eq("slug", slug).single()
  }
}

async function renderPost() {
  const postEl = document.getElementById("post")
  const slug = getSlug()
  if (!slug) { postEl.innerHTML = `<p class="empty">No post specified.</p>`; return }

  const { data: post, error } = await fetchPost(slug)
  if (error || !post) {
    console.error(error)
    postEl.innerHTML = `<p class="empty">Post not found.</p>`
    return
  }

  postEl.innerHTML = `
    <div class="post-hero">
      ${post.main_image_url ? `<img src="${post.main_image_url}" alt="">` : ""}
    </div>
    <h1>${post.title ?? "Untitled"}</h1>
    <div class="post-meta">
      ${post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB") : ""}
    </div>
    <div class="post-body">
      ${post.body || post.content || post.description || "<p>No content.</p>"}
    </div>
  `
}

// Boot
includePartials()
renderPost()
