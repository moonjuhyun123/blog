import { http } from "./http";
import type {
  PageResponsePostSummary,
  PostDetail,
  IdOnly,
  LikeToggleResponse,
  VisitSummary,
  User,
  Category,
  Comment,
} from "./types";

import axios from "axios";

export const googleLogin = async (idToken: string) => {
  const res = await axios.post(
    "/api/auth/google",
    { idToken },
    { withCredentials: true }
  );
  return res.data; // { user } 기대
};

export const getPost = (id: number) =>
  http.get<PostDetail>(`/api/posts/${id}`).then((r) => r.data);

export const blockUser = (userId: number, blocked: boolean) =>
  http
    .patch(`/api/users/${userId}/block`, { blocked }) // ✅ JSON body 포함
    .then((r) => r.data);

// Auth
export const login = (email: string, password: string) =>
  http.post<User>("/api/auth/login", { email, password }).then((r) => r.data);

export const register = (
  displayName: string,
  email: string,
  password: string
) =>
  http
    .post<IdOnly | User>("/api/auth/register", { displayName, email, password })
    .then((r) => r.data);

export const logout = () => http.post("/api/auth/logout").then((r) => r.data);
export const me = () => http.get<User>("/api/users/me").then((r) => r.data);

// Users(me) PATCH: multipart/form-data
export const patchMe = (payload: {
  displayName?: string;
  profileImage?: File;
}) => {
  const fd = new FormData();
  if (payload.displayName) fd.append("displayName", payload.displayName);
  if (payload.profileImage) fd.append("profileImage", payload.profileImage);
  return http
    .patch<User>("/api/users/me", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Posts
export const listPosts = (
  params: {
    page?: number;
    size?: number;
    title?: string;
    categoryId?: string;
    includePrivate?: boolean;
  } = {}
) =>
  http
    .get<PageResponsePostSummary>("/api/posts", { params })
    .then((r) => r.data);

export const createPost = (payload: {
  title: string;
  categoryId: number;
  contentMd: string;
  isPrivate?: boolean;
}) => http.post<IdOnly>("/api/posts", payload).then((r) => r.data);

export const updatePost = (
  id: number,
  payload: Partial<{
    title: string;
    categoryId: number;
    contentMd: string;
    isPrivate: boolean;
  }>
) => http.patch<IdOnly>(`/api/posts/${id}`, payload).then((r) => r.data);

export const listPostsByCategory = (
  categoryId: number,
  params: { page?: number; size?: number; title?: string } = {}
) =>
  http
    .get<PageResponsePostSummary>(`/api/categories/${categoryId}/posts`, {
      params,
    })
    .then((r) => r.data);

export const deletePost = (id: number) =>
  http.delete<void>(`/api/posts/${id}`).then((r) => r.data);
export const toggleLike = (postId: number) =>
  http
    .post<LikeToggleResponse>(`/api/posts/${postId}/like`)
    .then((r) => r.data);

// Categories (array)
export const listCategories = () =>
  http.get<Category[]>("/api/categories").then((r) => r.data);
export const createCategory = (name: string) =>
  http.post<IdOnly>("/api/categories", { name }).then((r) => r.data);
export const deleteCategory = (id: number) =>
  http.delete<void>(`/api/categories/${id}`).then((r) => r.data);
export const updateCategory = (id: number, name: string) =>
  http
    .patch<{ id: number; name: string }>(`/api/categories/${id}`, { name })
    .then((r) => r.data);
export const listCategorySummary = () =>
  http
    .get<
      {
        id: number;
        name: string;
        slug: string;
        createdAt: string;
        postCount: number;
      }[]
    >("/api/categories/summary", { params: { includePrivate: false } })
    .then((r) => r.data);

// Comments (array)
export const listComments = (postId: number) =>
  http.get<Comment[]>(`/api/posts/${postId}/comments`).then((r) => r.data);
export const createComment = (postId: number, content: string) =>
  http
    .post<IdOnly>(`/api/posts/${postId}/comments`, { content })
    .then((r) => r.data);
export const deleteComment = (id: number) =>
  http.delete<void>(`/api/comments/${id}`).then((r) => r.data);

// Analytics
export const analyticsVisit = () =>
  http.post<VisitSummary>("/api/analytics/visit").then((r) => r.data);
export const analyticsSummary = () =>
  http.get<VisitSummary>("/api/analytics/summary").then((r) => r.data);

// Media
export const uploadImage = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post<{ url: string }>("/api/media/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
