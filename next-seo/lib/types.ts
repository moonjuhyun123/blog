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
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
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

export interface NewsBriefing {
  id: number;
  briefingDate: string;
  contentHtml: string;
  createdAt: string;
  likeCount: number;
}
