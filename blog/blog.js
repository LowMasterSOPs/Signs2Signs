<script type="module">
export const SUPABASE_URL = "https://ketluxsokzvlqozcdwxo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGx1eHNva3p2bHFvemNkd3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAzOTIsImV4cCI6MjA3MDkzNjM5Mn0.NCPCOXJ4vD1PYb_sBgoyA6lSvkiRpb8IlA4X8XnltUs";

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getSessionId(){
  let id = localStorage.getItem('s2s_blog_session');
  if(!id){ id = crypto.randomUUID(); localStorage.setItem('s2s_blog_session', id); }
  return id;
}

export async function fetchPosts({sort='new', tag=null, page=1, pageSize=9}={}){
  let q = supabase.from('post_stats').select('*').eq('status','published');

  if(tag){
    const { data: ids } = await supabase
      .from('post_tags')
      .select('post_id, tags!inner(name)')
      .eq('tags.name', tag);
    const postIds = (ids||[]).map(r=>r.post_id);
    if(postIds.length===0) return { data: [], count: 0 };
    q = q.in('id', postIds);
  }

  if(sort==='new')   q = q.order('published_at', { ascending:false });
  if(sort==='views') q = q.order('views_count', { ascending:false }).order('published_at', { ascending:false });
  if(sort==='likes') q = q.order('likes_count', { ascending:false }).order('published_at', { ascending:false });

  const from = (page-1)*pageSize, to = from + pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if(error) throw error;
  return { data, count };
}

export async function fetchPostBySlug(slug){
  const { data, error } = await supabase
    .from('post_stats')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if(error) throw error;
  return data;
}

export async function fetchPostExtras(postId){
  const [imgs, tags] = await Promise.all([
    supabase.from('post_images').select('*').eq('post_id', postId).order('id', {ascending:true}),
    supabase.from('post_tags').select('tags(name)').eq('post_id', postId)
  ]);
  return {
    images: imgs.data || [],
    tags: (tags.data || []).map(t => t.tags?.name).filter(Boolean)
  };
}

export async function addView(postId){
  await supabase.from('post_views').insert({ post_id: postId });
}

export async function addLike(postId){
  const { error } = await supabase.from('post_likes').insert({
    post_id: postId, session_id: getSessionId()
  });
  return !error; // duplicate blocked by PK
}

export async function fetchTags(){
  const { data } = await supabase.from('tags').select('name').order('name');
  return data?.map(t=>t.name) || [];
}

export async function fetchArchive(){
  const { data } = await supabase.rpc('get_archive');
  return data || [];
}
</script>
