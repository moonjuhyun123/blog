package org.example.myproject.service;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.like.LikeToggleResponse;
import org.example.myproject.entity.news.NewsBriefing;
import org.example.myproject.entity.news.NewsLike;
import org.example.myproject.entity.news.NewsLikeId;
import org.example.myproject.entity.user.User;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.news.NewsBriefingRepository;
import org.example.myproject.repository.news.NewsLikeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewsLikeService {
    private final NewsLikeRepository likes;
    private final NewsBriefingRepository briefings;

    @Transactional
    public LikeToggleResponse toggle(Long briefingId, User u) {
        if (u.isBlocked()) throw new ApiException(HttpStatus.FORBIDDEN, "blocked");
        NewsBriefing briefing = briefings.findById(briefingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));

        var existing = likes.findByUserAndBriefing(u, briefing);
        boolean liked;
        if (existing.isPresent()) {
            likes.delete(existing.get());
            liked = false;
        } else {
            NewsLike nl = NewsLike.builder()
                    .id(new NewsLikeId(u.getId(), briefing.getId()))
                    .user(u)
                    .briefing(briefing)
                    .createdAt(LocalDateTime.now())
                    .build();
            likes.save(nl);
            liked = true;
        }
        int count = (int) likes.countByBriefing(briefing);
        return new LikeToggleResponse(liked, count);
    }
}
