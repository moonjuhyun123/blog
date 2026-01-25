export type UserRole = "USER" | "ADMIN";

export interface IdOnly {
  id: number;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  role: UserRole;
  blocked: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface PostSummary {
  id: number;
  title: string;
  category: { id: number; name: string; slug: string };
  likeCount: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface PageResponsePostSummary {
  content: PostSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PostDetail extends PostSummary {
  contentMd: string;
  contentHtml: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  content: string;
  author: { id: number; displayName: string; profileImageUrl?: string };
  createdAt: string;
  deleted: boolean;
}

export interface LikeToggleResponse {
  liked: boolean;
  likeCount: number;
}
export interface VisitSummary {
  dailyCount: number;
  totalCount: number;
}

export type Post = {
  id: number;
  title: string;
  content: string; // Markdown
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};
