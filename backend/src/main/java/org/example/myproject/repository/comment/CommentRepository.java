package org.example.myproject.repository.comment;


import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.comment.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPost(Post post, Pageable pageable);
    long countByPostAndDeletedFalse(Post post);
}
