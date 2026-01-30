package org.example.myproject.repository.post;


import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.category.Category;
import org.example.myproject.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByCategory(Category category, Pageable pageable);
    Page<Post> findByAuthor(User author, Pageable pageable);
    Page<Post> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<Post> findByIsPrivateFalse(Pageable pageable);
    java.util.Optional<Post> findFirstByIsPinnedTrueOrderByCreatedAtDesc();

    @Modifying
    @Query("update Post p set p.isPinned = false where p.isPinned = true and p.id <> :id")
    int unpinAllExcept(@Param("id") Long id);
}

