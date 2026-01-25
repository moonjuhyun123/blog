package org.example.myproject.service;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.like.LikeToggleResponse;
import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.like.PostLike;
import org.example.myproject.entity.like.PostLikeId;
import org.example.myproject.entity.user.User;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.like.PostLikeRepository;
import org.example.myproject.repository.post.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class LikeService {
    private final PostLikeRepository likes;
    private final PostRepository posts;

    @Transactional
    public LikeToggleResponse toggle(Long postId, User u) {
        if (u.isBlocked()) throw new ApiException(HttpStatus.FORBIDDEN, "blocked");
        Post p = posts.findById(postId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post Not Found"));

        var existing = likes.findByUserAndPost(u, p);
        boolean liked;
        if (existing.isPresent()) {
            likes.delete(existing.get());
            liked = false;
        } else {
            PostLike pl = PostLike.builder()
                    .id(new PostLikeId(u.getId(), p.getId()))
                    .user(u).post(p).createdAt(LocalDateTime.now()).build();
            likes.save(pl);
            liked = true;
        }
        int count = (int) likes.countByPost(p);
        return new LikeToggleResponse(liked, count);
    }
}

