import api from '../../api.js';
import type { LocationSelection } from '../components/LocationSearch';
import type { User as FirebaseUser } from 'firebase/auth';

async function getToken(user: FirebaseUser | null) {
  return user ? user.getIdToken() : null;
}

export async function listBlogs(params: {
  search?: string; location?: string; minLikes?: number; minComments?: number; near?: { lat: number; lng: number }; radiusKm?: number;
}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.location) qs.set('location', params.location);
  if (params.minLikes != null) qs.set('minLikes', String(params.minLikes));
  if (params.minComments != null) qs.set('minComments', String(params.minComments));
  if (params.near) qs.set('near', `${params.near.lat},${params.near.lng}`);
  if (params.radiusKm) qs.set('radiusKm', String(params.radiusKm));
  return api.get(`/blogs?${qs.toString()}`);
}

export async function createBlog(user: FirebaseUser | null, data: { title: string; content: string; locationSel?: LocationSelection | null }) {
  const token = await getToken(user);
  if (!token) throw new Error('Auth required');
  const body: any = { title: data.title, content: data.content };
  if (data.locationSel) {
    body.location = data.locationSel.address;
    body.lat = data.locationSel.lat;
    body.lng = data.locationSel.lng;
  }
  return api.post('/blogs', body, { auth: token });
}

export async function toggleReaction(user: FirebaseUser | null, blogId: string, type: 'like' | 'dislike') {
  const token = await getToken(user);
  if (!token) throw new Error('Auth required');
  return api.post(`/blogs/${blogId}/${type}`, {}, { auth: token });
}

export async function listComments(blogId: string) {
  return api.get(`/blogs/${blogId}/comments`);
}

export async function addComment(user: FirebaseUser | null, blogId: string, content: string) {
  const token = await getToken(user);
  if (!token) throw new Error('Auth required');
  return api.post(`/blogs/${blogId}/comments`, { content }, { auth: token });
}
