import { BlogPost as BlogPost_, BlogCategory } from './types';
export type BlogPost = BlogPost_;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper for fetch
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  const query = limit ? `?limit=${limit}` : '';
  return fetchApi<BlogPost[]>(`/blog${query}`);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    return await fetchApi<BlogPost>(`/blog/${slug}`);
  } catch (error) {
    return undefined;
  }
}

export async function getRelatedPosts(currentSlug: string, category: BlogCategory): Promise<BlogPost[]> {
  // Simple implementation: fetch all and filter or add a backend route
  const posts = await getBlogPosts();
  return posts
    .filter((post) => post.slug !== currentSlug && post.category === category)
    .slice(0, 3);
}
