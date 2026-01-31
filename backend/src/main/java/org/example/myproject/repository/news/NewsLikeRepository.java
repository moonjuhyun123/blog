package org.example.myproject.repository.news;

import java.util.Optional;
import org.example.myproject.entity.news.NewsBriefing;
import org.example.myproject.entity.news.NewsLike;
import org.example.myproject.entity.news.NewsLikeId;
import org.example.myproject.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsLikeRepository extends JpaRepository<NewsLike, NewsLikeId> {
    long countByBriefing(NewsBriefing briefing);
    boolean existsByUserAndBriefing(User user, NewsBriefing briefing);
    Optional<NewsLike> findByUserAndBriefing(User user, NewsBriefing briefing);
}
