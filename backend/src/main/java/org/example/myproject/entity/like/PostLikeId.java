package org.example.myproject.entity.like;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class PostLikeId implements Serializable {
    private Long userId;
    private Long postId;
}

