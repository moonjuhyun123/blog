package org.example.myproject.repository.category;

import java.util.List;
import java.util.Optional;

import org.example.myproject.dto.category.CategoryWithCountDto;
import org.example.myproject.entity.category.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
    @Query("select max(c.sortOrder) from Category c")
    Integer findMaxSortOrder();
    List<Category> findAllByOrderBySortOrderAscCreatedAtAsc();
    @Query("""
    select new org.example.myproject.dto.category.CategoryWithCountDto(
      c.id, c.name, c.slug, c.createdAt, c.sortOrder,
      count(p.id)
    )
    from Category c
    left join Post p
      on p.category = c
      and (:includePrivate = true or p.isPrivate = false)
    group by c.id, c.name, c.slug, c.createdAt, c.sortOrder
    order by coalesce(c.sortOrder, 1000000) asc, c.createdAt asc
  """)
    List<CategoryWithCountDto> findAllWithPostCount(boolean includePrivate);

}

