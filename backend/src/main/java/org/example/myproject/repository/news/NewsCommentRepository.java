package org.example.myproject.repository.news;

import org.example.myproject.entity.news.NewsBriefing;
import org.example.myproject.entity.news.NewsComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsCommentRepository extends JpaRepository<NewsComment, Long> {
    Page<NewsComment> findByBriefing(NewsBriefing briefing, Pageable pageable);
    long countByBriefingAndDeletedFalse(NewsBriefing briefing);
}
