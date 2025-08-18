// blog.js — Supabase client, fetch + render with "featured" support
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 🔧 Your Supabase project details
const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/** Fetch the single featured post, or null if none */
export async function fetchFeaturedPost() {
  // If (for any reason) multiple rows are marked featured, grab the newest by published_at/created_at
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, description, main_image_url, published_at, created_at, updated_at, featured")
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at",  { ascending: false, nullsFirst: false })
    .limit(1)
  return { data: data?.[0] ?? null, error }
}

/** Fetch all posts (for archive + grid), newest first */
export async function fetchAllPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, description, main_image_url, published_at, created_at, updated_at, featured")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at",  { ascending: false, nullsFirst: false })
    .order("id",          { ascending: false })
  return { data, error }
}

/** Load header.html and footer.html into placeholders */
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

// ====== Rendering glue (runs on blog.html) ======
const postsEl    = document.getElementById("posts")
const archiveEl  = document.getElementById("archive")
const featuredEl = document.getElementById("featured")

function groupByYearMonth(posts){
  const buckets = new Map()
  for(const p of posts){
    const d  = p.published_at || p.created_at || p.updated_at || null
    const dt = d ? new Date(d) : null
    const year  = dt ? dt.getFullYear() : "Unknown"
    const month = dt ? dt.toLocaleString("en-GB",{ month:"long" }) : "Unsorted"
    if(!buckets.has(year)) buckets.set(year, new Map())
    const byMonth = buckets.get(year)
    if(!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month).push(p)
  }
  return new Map([...buckets.entries()].sort((a,b)=>(b[0]+"").localeCompare(a[0]+"")))
}

function buildArchive(posts){
  const grouped = groupByYearMonth(posts)
  archiveEl.innerHTML = ""
  for(const [year, months] of grouped){
    const det = document.createElement("details")
    det.open = true
    const sum = document.createElement("summary")
    sum.textContent = year
    det.appendChild(sum)

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const orderedMonths = monthNames.filter(m=>months.has(m))
    if(months.has("Unsorted")) orderedMonths.push("Unsorted")

    for(const m of orderedMonths){
      const wrap = document.createElement("div")
      wrap.className = "month"
      const h4 = document.createElement("h4")
      h4.textContent = m
      wrap.appendChild(h4)

      const ul = document.createElement("ul")
      ul.className = "archive-list"
      for(const p of months.get(m)){
        const li = document.createElement("li")
        const a  = document.createElement("a")
        a.href = `post.html?slug=${encodeURIComponent(p.slug || p.id)}`
        a.textContent = p.title || "Untitled"
        li.appendChild(a)
        ul.appendChild(li)
      }
      wrap.appendChild(ul)
      det.appendChild(wrap)
    }
    archiveEl.appendChild(det)
  }
}

async function render() {
  postsEl.textContent = "Loading…"

  // Pull everything in parallel
  const [{ data: featured, error: featErr }, { data: allPosts, error: allErr }] =
    await Promise.all([fetchFeaturedPost(), fetchAllPosts()])

  if (featErr || allErr) {
    console.error(featErr || allErr)
    postsEl.textContent = "Error loading posts."
    return
  }

  if (!allPosts || allPosts.length === 0) {
    postsEl.innerHTML = `<p class="empty">No posts yet.</p>`
    archiveEl.innerHTML = `<p class="empty">Nothing to archive… yet.</p>`
    featuredEl.innerHTML = ""
    return
  }

  // 1) Featured block
  let hero = featured
  if (!hero) {
    // fallback: use newest post if none is marked featured
    hero = allPosts[0]
  }
  featuredEl.innerHTML = `
    ${hero.main_image_url ? `<img src="${hero.main_image_url}" alt="">` : ""}
    <div class="featured-content">
      <h2>${hero.title ?? "Untitled"}</h2>
      <p>${hero.description ?? ""}</p>
      <a href="post.html?slug=${encodeURIComponent(hero.slug || hero.id)}">Read full post →</a>
    </div>
  `

  // 2) Archive (built from all posts)
  buildArchive(allPosts)

  // 3) Grid of remaining posts (exclude the featured one if it’s in the list)
  const heroKey = hero.slug ?? hero.id
  const rest = allPosts.filter(p => (p.slug ?? p.id) !== heroKey)

  postsEl.innerHTML = ""
  for (const p of rest) {
    const a = document.createElement("a")
    a.className = "card"
    a.href = `post.html?slug=${encodeURIComponent(p.slug || p.id)}`
    a.innerHTML = `
      ${p.main_image_url ? `<img class="thumb" src="${p.main_image_url}" alt="">` : ""}
      <div class="title">${p.title ?? "Untitled"}</div>
      ${p.description ? `<p class="desc">${p.description}</p>` : ""}
    `
    postsEl.appendChild(a)
  }
}

// Boot if we’re on the blog page
if (document.getElementById("posts")) {
  includePartials()
  render()
}
