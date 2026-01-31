import type {
  Category,
  CategorySummary,
  Comment,
  IdOnly,
  LikeToggleResponse,
  PageResponse,
  PostDetail,
  PostSummary,
  NewsBriefing,
  User,
  VisitSummary,
} from "./types";

function getApiBaseUrl() {
  if (typeof window === "undefined") {
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    return base ? base.replace(/\/+$/, "") : "";
  }
  const base = process.env.NEXT_PUBLIC_API_URL;
  return base ? base.replace(/\/+$/, "") : "";
}

async function fetchJson<T>(path: string, options: RequestInit = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message = text || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const login = (email: string, password: string) =>
  fetchJson<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (displayName: string, email: string, password: string) =>
  fetchJson<IdOnly | User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName, email, password }),
  });

export const googleLogin = (idToken: string) =>
  fetchJson<User>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

export const logout = () =>
  fetchJson<void>("/api/auth/logout", {
    method: "POST",
  });

export const me = () => fetchJson<User>("/api/users/me");

export const patchMe = (payload: {
  displayName?: string;
  profileImage?: File;
}) => {
  const fd = new FormData();
  if (payload.displayName) fd.append("displayName", payload.displayName);
  if (payload.profileImage) fd.append("profileImage", payload.profileImage);

  return fetch(`${getApiBaseUrl()}/api/users/me`, {
    method: "PATCH",
    body: fd,
    credentials: "include",
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<User>;
  });
};

export const listPosts = (params: {
  page?: number;
  size?: number;
  title?: string;
  categoryId?: string;
  includePrivate?: boolean;
} = {}) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  });
  return fetchJson<PageResponse<PostSummary>>(`/api/posts?${usp.toString()}`);
};

export const getPost = (id: number) =>
  fetchJson<PostDetail>(`/api/posts/${id}`);

export const getPinnedPost = () =>
  fetchJson<PostSummary | null>("/api/posts/pinned");

export const createPost = (payload: {
  title: string;
  categoryId: number;
  contentMd: string;
  isPrivate?: boolean;
}) =>
  fetchJson<IdOnly>("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updatePost = (
  id: number,
  payload: Partial<{
    title: string;
    categoryId: number;
    contentMd: string;
    isPrivate: boolean;
  }>
) =>
  fetchJson<IdOnly>(`/api/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const pinPost = (id: number, pinned: boolean) =>
  fetchJson<IdOnly>(`/api/posts/${id}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ pinned }),
  });

export const deletePost = (id: number) =>
  fetchJson<void>(`/api/posts/${id}`, { method: "DELETE" });

export const listPostsByCategory = (
  categoryId: number,
  params: { page?: number; size?: number; title?: string; includePrivate?: boolean } = {}
) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  });
  const qs = usp.toString();
  return fetchJson<PageResponse<PostSummary>>(
    `/api/categories/${categoryId}/posts${qs ? `?${qs}` : ""}`
  );
};

export const listCategories = () =>
  fetchJson<Category[]>("/api/categories");

export const listCategorySummary = () =>
  fetchJson<CategorySummary[]>("/api/categories/summary?includePrivate=false");

export const createCategory = (name: string) =>
  fetchJson<IdOnly>("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateCategory = (id: number, name: string) =>
  fetchJson<{ id: number; name: string }>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const deleteCategory = (id: number) =>
  fetchJson<void>(`/api/categories/${id}`, { method: "DELETE" });

export const reorderCategories = (orderedIds: number[]) =>
  fetchJson<void>("/api/categories/order", {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });

export const listComments = (postId: number) =>
  fetchJson<Comment[]>(`/api/posts/${postId}/comments`);

export const createComment = (postId: number, content: string) =>
  fetchJson<IdOnly>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const deleteComment = (id: number) =>
  fetchJson<void>(`/api/comments/${id}`, { method: "DELETE" });

export const toggleLike = (postId: number) =>
  fetchJson<LikeToggleResponse>(`/api/posts/${postId}/like`, {
    method: "POST",
  });

export const analyticsVisit = () =>
  fetchJson<VisitSummary>("/api/analytics/visit", { method: "POST" });

export const analyticsSummary = () =>
  fetchJson<VisitSummary>("/api/analytics/summary");

export const listNews = (params: { from?: string; to?: string; q?: string } = {}) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  });
  const qs = usp.toString();
  return fetchJson<NewsBriefing[]>(`/api/news${qs ? `?${qs}` : ""}`);
};

export const runNewsBriefing = () =>
  fetchJson<NewsBriefing>("/internal/briefing/run", { method: "POST" });

export const getNewsByDate = (date: string) =>
  fetchJson<NewsBriefing>(`/api/news/${date}`);

export const listNewsComments = (newsId: number) =>
  fetchJson<Comment[]>(`/api/news/${newsId}/comments`);

export const createNewsComment = (newsId: number, content: string) =>
  fetchJson<IdOnly>(`/api/news/${newsId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const deleteNewsComment = (id: number) =>
  fetchJson<void>(`/api/news/comments/${id}`, { method: "DELETE" });

export const toggleNewsLike = (newsId: number) =>
  fetchJson<LikeToggleResponse>(`/api/news/${newsId}/like`, { method: "POST" });

export const blockUser = (userId: number, blocked: boolean) =>
  fetchJson<User>(`/api/users/${userId}/block`, {
    method: "PATCH",
    body: JSON.stringify({ blocked }),
  });

export const uploadImage = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${getApiBaseUrl()}/api/media/image`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ url: string }>;
};
