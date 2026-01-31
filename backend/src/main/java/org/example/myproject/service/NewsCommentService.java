package org.example.myproject.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.comment.CommentCreateRequest;
import org.example.myproject.dto.comment.CommentDto;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.entity.news.NewsBriefing;
import org.example.myproject.entity.news.NewsComment;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.news.NewsBriefingRepository;
import org.example.myproject.repository.news.NewsCommentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewsCommentService {

    private final NewsCommentRepository comments;
    private final NewsBriefingRepository briefings;

    public List<CommentDto> list(Long briefingId) {
        NewsBriefing briefing = briefings.findById(briefingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        return comments.findByBriefing(briefing, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(CommentDto::from)
                .toList();
    }

    @Transactional
    public IdOnly create(Long briefingId, CommentCreateRequest body, User writer) {
        if (writer.isBlocked()) throw new ApiException(HttpStatus.FORBIDDEN, "blocked");
        NewsBriefing briefing = briefings.findById(briefingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        NewsComment c = NewsComment.builder()
                .briefing(briefing)
                .author(writer)
                .content(body.content())
                .deleted(false)
                .build();
        return new IdOnly(comments.save(c).getId());
    }

    @Transactional
    public void delete(Long id, User actor) {
        NewsComment c = comments.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        boolean owner = c.getAuthor().getId().equals(actor.getId());
        boolean admin = actor.getRole() == UserRole.ADMIN;
        if (!owner && !admin) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
        c.softDelete();
    }
}
