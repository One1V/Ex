import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../../api.js';

interface AdminUser { _id: string; name: string; email: string; role: 'user'|'admin'|'guide'; firebaseUid: string; }
interface AdminBlog { _id: string; title: string; content: string; location: string; createdAt: string; }

const Admin: React.FC = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(false);

  // Create user form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as 'user'|'admin'|'guide' });

  async function authGet(path: string) {
    const t = await user!.getIdToken();
    return api.get(path, { auth: t });
  }
  async function authPost(path: string, body: any) {
    const t = await user!.getIdToken();
    return api.post(path, body, { auth: t });
  }
  async function authPatch(path: string, body: any) {
    const t = await user!.getIdToken();
    return api.patch(path, body, { auth: t });
  }
  async function authDelete(path: string) {
    const t = await user!.getIdToken();
    return api.delete(path, { auth: t });
  }

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const [u, b] = await Promise.all([
        authGet('/admin/users'),
        authGet('/admin/blogs')
      ]);
      setUsers(u);
      setBlogs(b);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (role === 'admin') loadAll(); }, [role]);

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-semibold">Forbidden</h1>
          <p className="text-slate-600">You need admin access to view this page.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">Admin</h1>
          <button onClick={loadAll} className="px-4 py-2 rounded bg-emerald-600 text-white">Refresh</button>
        </div>
        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {/* Create user */}
        <section className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Create User</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <input className="border px-3 py-2 rounded" placeholder="Name" value={newUser.name} onChange={e=>setNewUser(s=>({ ...s, name: e.target.value }))} />
            <input className="border px-3 py-2 rounded" placeholder="Email" value={newUser.email} onChange={e=>setNewUser(s=>({ ...s, email: e.target.value }))} />
            <input className="border px-3 py-2 rounded" placeholder="Password" type="password" value={newUser.password} onChange={e=>setNewUser(s=>({ ...s, password: e.target.value }))} />
            <select className="border px-3 py-2 rounded" value={newUser.role} onChange={e=>setNewUser(s=>({ ...s, role: e.target.value as any }))}>
              <option value="user">user</option>
              <option value="guide">guide</option>
              <option value="admin">admin</option>
            </select>
            <button
              onClick={async()=>{ const u=await authPost('/admin/users', newUser); setUsers(prev=>[...prev, u.user]); setNewUser({ name:'', email:'', password:'', role:'user' }); }}
              className="px-4 py-2 rounded bg-emerald-600 text-white"
            >Create</button>
          </div>
        </section>

        {/* Users table */}
        <section className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Users</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <select value={u.role} onChange={async e=>{
                        const role = e.target.value as 'user'|'guide'|'admin';
                        const resp = await authPatch(`/admin/users/${u._id}/role`, { role });
                        setUsers(prev=>prev.map(x=>x._id===u._id? resp.user : x));
                      }} className="border px-2 py-1 rounded">
                        <option value="user">user</option>
                        <option value="guide">guide</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-2 space-x-2">
                      <button onClick={async()=>{ if(confirm('Delete user?')) { await authDelete(`/admin/users/${u._id}`); setUsers(prev=>prev.filter(x=>x._id!==u._id)); } }} className="px-3 py-1 rounded bg-rose-600 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Blogs table */}
        <section className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Blogs</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2 w-48">Title</th>
                  <th className="p-2">Content</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(b => (
                  <tr key={b._id} className="border-b align-top">
                    <td className="p-2">{b.title}</td>
                    <td className="p-2 max-w-lg">
                      <textarea defaultValue={b.content} className="w-full border px-2 py-1 rounded" rows={3}
                        onBlur={async (e)=>{ const content=e.target.value; await authPatch(`/admin/blogs/${b._id}`, { content }); setBlogs(prev=>prev.map(x=>x._id===b._id? { ...x, content } : x)); }} />
                    </td>
                    <td className="p-2">{b.location}</td>
                    <td className="p-2">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      <button onClick={async()=>{ if(confirm('Delete blog?')) { await authDelete(`/admin/blogs/${b._id}`); setBlogs(prev=>prev.filter(x=>x._id!==b._id)); } }} className="px-3 py-1 rounded bg-rose-600 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
