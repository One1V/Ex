import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LocationSearch from '../components/LocationSearch';
import type { LocationSelection } from '../components/LocationSearch';
import api from '../../api.js';
import { useAuth } from '../context/AuthContext';

interface BlogItem {
  id: string;
  title: string;
  content: string;
  author?: string;
  location?: string;
  examCenterAddress?: string;
  coordinates?: { lat: number; lng: number } | null;
  likes: number;
  dislikes: number;
  commentsCount: number;
  createdAt: string;
}

interface CommentItem {
  id: string; blog: string; author: string; content: string; createdAt: string; replies?: CommentItem[];
}

const Blog: React.FC = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locSel, setLocSel] = useState<LocationSelection | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortLikes, setSortLikes] = useState<'asc' | 'desc'>('desc');
  const [examCenter, setExamCenter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  // replies handled inside CommentThread component

  async function fetchBlogs() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (locationFilter) params.set('location', locationFilter);
      if (sortLikes) params.set('sortLikes', sortLikes);
      const data = await api.get(`/blogs?${params.toString()}`);
      setBlogs(data);
    } catch (e:any) {
      setError(e.message || 'Failed to load blogs');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchBlogs(); }, []);

  async function handleCreateBlog(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      if (!locSel) { alert('Location is required. Please select from dropdown.'); return; }
      const body: any = { title, content, location: locSel.address, lat: locSel.lat, lng: locSel.lng };
      if (examCenter.trim()) body.examCenterAddress = examCenter.trim();
      const t = await user.getIdToken();
      const created = await api.post('/blogs', body, { auth: t });
      setBlogs(prev => [created, ...prev]);
      setTitle(''); setContent(''); setLocSel(null); setExamCenter('');
      setExpanded(null);
    } catch (e:any) { alert(e.message || 'Create failed'); }
  }

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id);
    if (expanded !== id && !comments[id]) {
      loadComments(id);
    }
  }

  async function loadComments(id: string) {
    try {
      const data = await api.get(`/blogs/${id}/comments`);
      setComments(prev => ({ ...prev, [id]: data }));
    } catch (e:any) {
      console.warn('Failed to load comments', e.message);
    }
  }

  async function submitComment(blogId: string) {
    if (!user || !newComment.trim()) return;
    setCommentLoading(true);
    try {
      const t = await user.getIdToken();
      const c = await api.post(`/blogs/${blogId}/comments`, { content: newComment }, { auth: t });
      setComments(prev => ({ ...prev, [blogId]: [c, ...(prev[blogId] || [])] }));
      // update count
      setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, commentsCount: b.commentsCount + 1 } : b));
      setNewComment('');
    } catch (e:any) { alert(e.message || 'Comment failed'); }
    finally { setCommentLoading(false); }
  }

  async function submitReply(blogId: string, parentId: string, text: string) {
    const trimmed = text.trim();
    if (!user || !trimmed) return;
    try {
      const t = await user.getIdToken();
      const r = await api.post(`/blogs/${blogId}/comments`, { content: trimmed, parentComment: parentId }, { auth: t });
      setComments(prev => ({
        ...prev,
        [blogId]: insertReply(prev[blogId] || [], parentId, r)
      }));
      setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, commentsCount: b.commentsCount + 1 } : b));
    } catch (e:any) { alert(e.message || 'Reply failed'); }
  }

  function insertReply(list: CommentItem[], parentId: string, reply: CommentItem): CommentItem[] {
    return (list || []).map(item => {
      if (item.id === parentId) {
        const replies = item.replies ? [reply, ...item.replies] : [reply];
        return { ...item, replies };
      }
      if (item.replies && item.replies.length) {
        return { ...item, replies: insertReply(item.replies, parentId, reply) };
      }
      return item;
    });
  }

  async function react(blogId: string, action: 'like' | 'dislike') {
    if (!user) return;
    try {
      const t = await user.getIdToken();
      const updated = await api.post(`/blogs/${blogId}/${action}`, {}, { auth: t });
      setBlogs(prev => prev.map(b => b.id === blogId ? updated : b));
    } catch (e:any) { alert(e.message || 'Action failed'); }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">Blog</h1>
        {/* Filters */}
        <div className="mb-8 grid gap-4 md:grid-cols-5 items-end">
          <input value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} placeholder="Filter by location" className="border px-3 py-2 rounded" />
          <select value={sortLikes} onChange={e=>setSortLikes(e.target.value as 'asc'|'desc')} className="border px-3 py-2 rounded text-sm">
            <option value="desc">Top to bottom (Most liked)</option>
            <option value="asc">Bottom to top (Least liked)</option>
          </select>
          <button onClick={fetchBlogs} className="bg-emerald-600 text-white rounded px-4 py-2 font-medium">Apply</button>
        </div>

        {/* Floating create button */}
        {user && (
          <button
            type="button"
            onClick={() => setExpanded(expanded === 'NEW' ? null : 'NEW')}
            className="fixed top-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-emerald-500/40 text-3xl flex items-center justify-center"
            aria-label={expanded === 'NEW' ? 'Close blog creator' : 'Create blog'}
          >
            {expanded === 'NEW' ? '×' : '+'}
          </button>
        )}

        {user && expanded === 'NEW' && (
          <form onSubmit={handleCreateBlog} className="mb-10 space-y-4 p-4 border rounded-lg bg-white shadow-xl">
            <h2 className="text-xl font-semibold">Create a Blog Post</h2>
            <input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Title" className="w-full border px-3 py-2 rounded" />
            <textarea value={content} onChange={e=>setContent(e.target.value)} required placeholder="Content" rows={6} className="w-full border px-3 py-2 rounded" />
            <LocationSearch value={locSel} onSelect={setLocSel} placeholder="Select location (required)" />
            <input
              type="text"
              placeholder="Exam Center Full Address (optional)"
              className="w-full border px-3 py-2 rounded"
              onChange={e=>setExamCenter(e.target.value)}
              value={examCenter}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Location is mandatory. Choose from dropdown results.</p>
              <button type="submit" className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white rounded px-6 py-2 font-semibold">Publish</button>
            </div>
          </form>
        )}

        {loading && <p className="text-sm text-slate-500">Loading blogs...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && !error && blogs.length === 0 && <p className="text-sm text-slate-500">No blogs found.</p>}

        <ul className="space-y-6">
          {blogs.map(b => (
            <li key={b.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm whitespace-pre-line mb-2 text-slate-700">{b.content.slice(0, 300)}{b.content.length > 300 ? '…' : ''}</p>
                  {b.location && <p className="text-xs text-emerald-700">📍 {b.location}</p>}
                  {b.examCenterAddress && <p className="text-xs text-slate-600">🏫 {b.examCenterAddress}</p>}
                  <div className="flex gap-4 mt-2 text-xs">
                    <button type="button" onClick={()=>react(b.id,'like')} className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100">👍 {b.likes}</button>
                    <button type="button" onClick={()=>react(b.id,'dislike')} className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100">👎 {b.dislikes}</button>
                    <button type="button" onClick={()=>toggleExpand(b.id)} className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100">💬 {b.commentsCount}</button>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">{new Date(b.createdAt).toLocaleString()}</span>
              </div>
              {expanded === b.id && (
                <div className="mt-4 border-t pt-4">
                  {user && (
                    <div className="mb-3 flex gap-2">
                      <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Write a comment" className="flex-1 border px-3 py-2 rounded" />
                      <button disabled={commentLoading} onClick={()=>submitComment(b.id)} type="button" className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50">Send</button>
                    </div>
                  )}
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {comments[b.id] ? (
                      comments[b.id].length > 0 ? (
                        <CommentThread
                          blogId={b.id}
                          items={comments[b.id]}
                          depth={0}
                          onReply={(parentId, text) => { void submitReply(b.id, parentId, text); }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500">No comments yet.</p>
                      )
                    ) : (
                      <p className="text-xs text-slate-500">Loading comments…</p>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;

// Nested comment thread renderer
function CommentThread({ items, depth, blogId, onReply }: { items: CommentItem[]; depth: number; blogId: string; onReply: (parentId: string, text: string) => void }) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpenLocal] = useState<Record<string, boolean>>({});
  const [replyTexts, setReplyTextsLocal] = useState<Record<string, string>>({});

  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item.id} className="text-sm">
          <div className="border-b pb-2" style={{ marginLeft: depth * 16 }}>
            <p className="text-slate-700">{item.content}</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
              {user && (
                <button
                  type="button"
                  className="text-[11px] text-emerald-700 hover:underline"
                  onClick={() => setReplyOpenLocal(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                >
                  Reply
                </button>
              )}
            </div>
            {replyOpen[item.id] && user && (
              <div className="mt-2 flex gap-2">
                <input
                  value={replyTexts[item.id] || ''}
                  onChange={e => setReplyTextsLocal(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Write a reply"
                  className="flex-1 border px-3 py-2 rounded"
                />
                <button
                  onClick={() => { const text = (replyTexts[item.id] || ''); onReply(item.id, text); setReplyTextsLocal(prev => ({ ...prev, [item.id]: '' })); setReplyOpenLocal(prev => ({ ...prev, [item.id]: false })); }}
                  type="button"
                  className="bg-emerald-600 text-white px-3 py-2 rounded"
                >
                  Send
                </button>
              </div>
            )}
          </div>
          {item.replies && item.replies.length > 0 && (
            <CommentThread blogId={blogId} items={item.replies} depth={depth + 1} onReply={onReply} />
          )}
        </li>
      ))}
    </ul>
  );
}
