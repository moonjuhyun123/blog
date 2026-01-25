package org.example.myproject.service;


import java.text.Normalizer;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.category.CategoryCreateRequest;
import org.example.myproject.dto.category.CategoryDto;
import org.example.myproject.dto.category.CategoryUpdateRequest;
import org.example.myproject.dto.category.CategoryWithCountDto;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.entity.category.Category;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.mapper.DtoMapper;
import org.example.myproject.repository.category.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository repo;

    public List<CategoryDto> list() {
        return repo.findAll().stream().map(DtoMapper::toCategoryDto).toList();
    }

    @Transactional
    public IdOnly create(CategoryCreateRequest req, User admin) {
        requireAdmin(admin);
        String slug = toSlug(req.name());
        if (repo.existsBySlug(slug)) throw new ApiException(HttpStatus.CONFLICT, "slug exists");
        Category c = Category.builder().name(req.name()).slug(slug).build();
        return new IdOnly(repo.save(c).getId());
    }

    @Transactional
    public CategoryDto update(Long id, CategoryUpdateRequest req, User admin) {
        requireAdmin(admin);
        Category c = repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        try {
            var f = c.getClass().getDeclaredField("name");
            f.setAccessible(true);
            f.set(c, req.name());
        } catch (Exception ignored) {
        }
        return DtoMapper.toCategoryDto(c);
    }

    @Transactional
    public void delete(Long id, User admin) {
        requireAdmin(admin);
        if (!repo.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Not Found");
        repo.deleteById(id);
    }

    private void requireAdmin(User u) {
        if (u.getRole() != UserRole.ADMIN) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    private String toSlug(String name) {
        String n = Normalizer.normalize(name.trim().toLowerCase(), Normalizer.Form.NFKD)
                .replaceAll("[^\\p{Alnum}\\s-]", "")
                .replaceAll("[\\s]+", "-");
        return n.isBlank() ? "cat" + System.currentTimeMillis() : n;
    }

    public List<CategoryWithCountDto> listWithCounts(User current, Boolean includePrivate) {
        boolean allowPrivate = current != null
                && current.getRole() == UserRole.ADMIN
                && Boolean.TRUE.equals(includePrivate);
        return repo.findAllWithPostCount(allowPrivate);
    }
}
