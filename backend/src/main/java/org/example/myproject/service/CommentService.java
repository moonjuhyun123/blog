package org.example.myproject.service;


import java.util.List;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.comment.CommentCreateRequest;
import org.example.myproject.dto.comment.CommentDto;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.comment.Comment;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.mapper.DtoMapper;
import org.example.myproject.repository.comment.CommentRepository;
import org.example.myproject.repository.post.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class CommentService {

    private final CommentRepository comments;
    private final PostRepository posts;

    public List<CommentDto> list(Long postId) {
        Post p = posts.findById(postId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post Not Found"));
        return comments.findByPost(p, org.springframework.data.domain.Pageable.unpaged())
                .stream().map(DtoMapper::toCommentDto).toList();
    }

    @Transactional
    public IdOnly create(Long postId, CommentCreateRequest body, User writer) {
        if (writer.isBlocked()) throw new ApiException(HttpStatus.FORBIDDEN, "blocked");
        Post p = posts.findById(postId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post Not Found"));
        Comment c = Comment.builder().post(p).author(writer).content(body.content()).deleted(false).build();
        return new IdOnly(comments.save(c).getId());
    }

    @Transactional
    public void delete(Long id, User actor) {
        Comment c = comments.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        boolean owner = c.getAuthor().getId().equals(actor.getId());
        boolean admin = actor.getRole()== UserRole.ADMIN;
        if (!owner && !admin) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
        c.softDelete(); // 소프트 삭제
    }
}

