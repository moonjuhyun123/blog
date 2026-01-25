package org.example.myproject.repository.media;

import org.example.myproject.entity.media.MediaImage;
import org.example.myproject.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaImageRepository extends JpaRepository<MediaImage, Long> {
    Page<MediaImage> findByUploader(User uploader, Pageable pageable);
}

