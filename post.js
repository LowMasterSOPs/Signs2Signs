// post.js — pretty URL version (/blog/<slug>)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function includePartials({ headerSel="#header", footerSel="#footer" }={}) {
  try {
    const [header, footer] = await Promise.all([
      fetch("/header.html").then(r=>r.ok?r.text():""),
      fetch("/footer.html").then(r=>r.ok?r.text():"")
    ])
    const h = document.querySelector(headerSel), f = document.querySelector(footerSel)
    if (h) h.innerHTML = header
    if (f) f.innerHTML = footer
  } catch(e){ console.error(e) }
}

// /blog/<slug> → get last segment
function getSlugFromPath(){
  const parts = window.location.pathname.replace(/\/+$/,"").split("/")
  // expects ['', 'blog', '<slug>']
  return decodeURIComponent(parts.pop() || "")
}

async function fetchPostBySlug(slug){
  return supabase.from("posts").select("*").eq("slug", slug).single()
}

async function loadComments(postId){
  const list = document.getElementById("comments-list")
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at",{ ascending:false })
  if (error){ list.innerHTML = "<p>Error loading comments.</p>"; return }
  if (!data || data.length===0){ list.innerHTML = "<p>No comments yet.</p>"; return }

  list.innerHTML = ""
  data.forEach(c=>{
    const div = document.createElement("div")
    div.className = "comment-item"
    div.innerHTML = `
      <div class="meta">${c.name} • ${new Date(c.created_at).toLocaleDateString("en-GB")}</div>
      <div class="text">${c.comment}</div>
    `
    list.appendChild(div)
  })
}

function setupCommentForm(postId){
  const form = document.getElementById("comment-form")
  form.addEventListener("submit", async e=>{
    e.preventDefault()
    const name = document.getElementById("comment-name").value.trim()
    const email = document.getElementById("comment-email").value.trim()
    const text = document.getElementById("comment-text").value.trim()
    if (!name || !email || !text) return
    const { error } = await supabase.from("comments").insert([{ post_id: postId, name, email, comment: text }])
    if (error){ alert("Error saving comment"); console.error(error) }
    else { form.reset(); loadComments(postId) }
  })
}

async function renderPost(){
  const postEl = document.getElementById("post")
  const shareCard = document.getElementById("share-section")
  const slug = getSlugFromPath()

  if (!slug){ postEl.innerHTML = `<p class="empty">No post specified.</p>`; return }

  const { data: post, error } = await fetchPostBySlug(slug)
  if (error || !post){ console.error(error); postEl.innerHTML = `<p class="empty">Post not found.</p>`; return }

  // Set page <title> + <meta description>
  document.title = `${post.title ?? "Blog Post"} | Signs2Signs Blog`
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute("content", post.description || post.title || "")

  // Render post
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

  // Share buttons
  const currentUrl = window.location.href
  shareCard.style.display = "block"
  document.getElementById("share-linkedin").href =
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
  document.getElementById("share-facebook").href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
  document.getElementById("share-twitter").href =
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title ?? "Check this out!")}`

  // Comments
  loadComments(post.id)
  setupCommentForm(post.id)
}

includePartials()
renderPost()
