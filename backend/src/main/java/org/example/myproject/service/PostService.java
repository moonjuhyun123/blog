package org.example.myproject.service;


import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.util.data.MutableDataSet;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.dto.common.PageResponse;
import org.example.myproject.dto.post.*;
import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.category.Category;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.mapper.DtoMapper;
import org.example.myproject.repository.category.CategoryRepository;
import org.example.myproject.repository.like.PostLikeRepository;
import org.example.myproject.repository.post.PostRepository;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;


@Service @RequiredArgsConstructor
public class PostService {
    private final PostRepository posts;
    private final CategoryRepository categories;
    private final PostLikeRepository likes;

    public PageResponse<PostSummary> search(Integer page, Integer size, String title, String categoryIds, Boolean includePrivate, User current) {
        boolean admin = current != null && current.getRole()== UserRole.ADMIN && Boolean.TRUE.equals(includePrivate);
        Pageable pageable = PageRequest.of(
                page==null?0:page,
                size==null?10:size,
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt"))
        );

        Page<Post> p;
        if (categoryIds != null && !categoryIds.isBlank()) {
            Set<Long> ids = Arrays.stream(categoryIds.split(",")).map(String::trim).filter(s->!s.isBlank()).map(Long::valueOf).collect(Collectors.toSet());
            // 단순 구현: 카테고리 하나만 필터링 (여러개 조합 필터가 필요하면 Specification/QueryDSL)
            Category c = categories.findById(ids.iterator().next()).orElse(null);
            if (c != null) p = title==null || title.isBlank()
                    ? posts.findByCategory(c, pageable)
                    : posts.findByTitleContainingIgnoreCase(title, pageable).map(x->x); // 간단화
            else p = Page.empty(pageable);
        } else {
            p = (title==null || title.isBlank())
                    ? (admin ? posts.findAll(pageable) : posts.findByIsPrivateFalse(pageable))
                    : posts.findByTitleContainingIgnoreCase(title, pageable);
        }

        List<PostSummary> content = p.stream()
                .filter(po -> admin || !po.isPrivate()) // 비관리자는 비공개 제외
                .map(po -> DtoMapper.toPostSummary(po, (int) likes.countByPost(po)))
                .toList();
        return new PageResponse<>(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    public PageResponse<PostSummary> listByCategory(Long categoryId, Integer page, Integer size, String title, Boolean includePrivate, User current) {
        Pageable pageable = PageRequest.of(
                page==null?0:page,
                size==null?10:size,
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt"))
        );
        Category c = categories.findById(categoryId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        boolean admin = current != null && current.getRole()== UserRole.ADMIN && Boolean.TRUE.equals(includePrivate);
        Page<Post> p = (title==null || title.isBlank())
                ? posts.findByCategory(c, pageable)
                : posts.findByTitleContainingIgnoreCase(title, pageable);
        var content = p.stream().filter(po -> admin || !po.isPrivate())
                .map(po-> DtoMapper.toPostSummary(po, (int)likes.countByPost(po))).toList();
        return new PageResponse<>(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    @Transactional
    public IdOnly create(PostCreateRequest body, User admin) {
        requireAdmin(admin);
        Category c = categories.findById(body.categoryId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category Not Found"));
        Post p = Post.builder()
                .title(body.title())
                .category(c)
                .author(admin)
                .contentMd(body.contentMd())
                .contentHtml(Markdown.toHtml(body.contentMd()))
                .isPrivate(Boolean.TRUE.equals(body.isPrivate()))
                .build();
        return new IdOnly(posts.save(p).getId());
    }

//    @Transactional
//    public IdOnly createInCategory(Long categoryId, PostCreateInCategoryRequest body, User admin) {
//        requireAdmin(admin);
//        Category c = categories.findById(categoryId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category Not Found"));
//        Post p = Post.builder()
//                .title(body.title())
//                .category(c)
//                .author(admin)
//                .contentMd(body.contentMd())
//                .contentHtml(Markdown.toHtml(body.contentMd()))
//                .isPrivate(Boolean.TRUE.equals(body.isPrivate()))
//                .build();
//        return new IdOnly(posts.save(p).getId());
//    }

    @Transactional(readOnly = true)
    public PostDetail get(Long id, User current) {
        Post p = posts.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        if (p.isPrivate()) {
            if (current==null || current.getRole()!=UserRole.ADMIN) throw new ApiException(HttpStatus.NOT_FOUND, "Not Found");
        }
        int likeCount = (int) likes.countByPost(p);
        return DtoMapper.toPostDetail(p, likeCount);
    }

    @Transactional(readOnly = true)
    public PostSummary getPinned(User current) {
        var pinned = posts.findFirstByIsPinnedTrueOrderByCreatedAtDesc().orElse(null);
        if (pinned == null) return null;
        if (pinned.isPrivate()) {
            if (current == null || current.getRole() != UserRole.ADMIN) return null;
        }
        int likeCount = (int) likes.countByPost(pinned);
        return DtoMapper.toPostSummary(pinned, likeCount);
    }

    @Transactional
    public IdOnly update(Long id, PostUpdateRequest body, User admin) {
        requireAdmin(admin);
        Post p = posts.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        if (body.title() != null && !body.title().isBlank()) {
            p.setTitle(body.title().trim());
        }
        if (body.categoryId()!=null) {
            Category c = categories.findById(body.categoryId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category Not Found"));
            p.moveCategory(c);
        }
        if (body.contentMd()!=null) p.updateContent(body.contentMd(), Markdown.toHtml(body.contentMd()));
        if (body.isPrivate()!=null) p.setPrivate(body.isPrivate());
        return new IdOnly(p.getId());
    }

    @Transactional
    public IdOnly pin(Long id, boolean pinned, User admin) {
        requireAdmin(admin);
        Post p = posts.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        if (pinned) {
            posts.unpinAllExcept(p.getId());
        }
        p.setPinned(pinned);
        return new IdOnly(p.getId());
    }

    @Transactional
    public void delete(Long id, User admin) {
        requireAdmin(admin);
        if (!posts.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Not Found");
        posts.deleteById(id);
    }

    private void requireAdmin(User u) {
        if (u.getRole()!=UserRole.ADMIN) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    private static void setField(Object obj, String name, Object val) {
        try {
            var f = obj.getClass().getDeclaredField(name);
            f.setAccessible(true); f.set(obj, val);
        } catch (Exception ignored) {}
    }

    // 아주 간단한 마크다운→HTML; 실제로는 flexmark 등 라이브러리 사용 권장
    static class Markdown {
        private static final Parser parser;
        private static final HtmlRenderer renderer;

        static {
            MutableDataSet options = new MutableDataSet();
            // 옵션 설정 가능 (예: 표, 코드 블록, 하이라이팅 등)
            parser = Parser.builder(options).build();
            renderer = HtmlRenderer.builder(options).build();
        }

        public static String toHtml(String md) {
            if (md == null || md.isBlank()) return "";
            Node document = parser.parse(md);
            return renderer.render(document);
        }
    }
}

