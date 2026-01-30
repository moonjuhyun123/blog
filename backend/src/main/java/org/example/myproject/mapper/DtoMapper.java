package org.example.myproject.mapper;


import org.example.myproject.dto.category.CategoryDto;
import org.example.myproject.dto.comment.CommentDto;
import org.example.myproject.dto.post.PostDetail;
import org.example.myproject.dto.post.PostSummary;
import org.example.myproject.dto.user.UserDto;
import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.category.Category;
import org.example.myproject.entity.comment.Comment;
import org.example.myproject.entity.news.NewsComment;
import org.example.myproject.entity.user.User;

public class DtoMapper {

    public static UserDto toUserDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getDisplayName(),
                u.getProfileImageUrl(), u.getRole(), u.isBlocked());
    }

    public static CategoryDto toCategoryDto(Category c) {
        return new CategoryDto(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getCreatedAt(),
                c.getSortOrder()
        );
    }

    public static PostSummary.Category toPostCategory(Category c) {
        return new PostSummary.Category(c.getId(), c.getName(), c.getSlug());
    }

    public static PostSummary toPostSummary(Post p, int likeCount) {
        return new PostSummary(
                p.getId(), p.getTitle(), toPostCategory(p.getCategory()),
                likeCount, p.isPinned(), p.isPrivate(), p.getCreatedAt());
    }

    public static PostDetail toPostDetail(Post p, int likeCount) {
        return new PostDetail(
                p.getId(), p.getTitle(), toPostCategory(p.getCategory()),
                likeCount, p.isPinned(), p.isPrivate(), p.getCreatedAt(),
                p.getContentMd(), p.getContentHtml(), p.getUpdatedAt());
    }

    public static CommentDto toCommentDto(Comment c) {
        User a = c.getAuthor();
        return new CommentDto(
                c.getId(), c.getContent(),
                new CommentDto.Author(a.getId(), a.getDisplayName(), a.getProfileImageUrl()),
                c.getCreatedAt(), c.isDeleted());
    }

    public static CommentDto toCommentDto(NewsComment c) {
        User a = c.getAuthor();
        return new CommentDto(
                c.getId(), c.getContent(),
                new CommentDto.Author(a.getId(), a.getDisplayName(), a.getProfileImageUrl()),
                c.getCreatedAt(), c.isDeleted());
    }
}

