package org.example.myproject.repository.like;


import java.util.Optional;

import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.like.PostLike;
import org.example.myproject.entity.like.PostLikeId;
import org.example.myproject.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
    long countByPost(Post post);
    boolean existsByUserAndPost(User user, Post post);
    Optional<PostLike> findByUserAndPost(User user, Post post);
}

