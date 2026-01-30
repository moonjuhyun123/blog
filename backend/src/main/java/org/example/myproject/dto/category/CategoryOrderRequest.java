package org.example.myproject.dto.category;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CategoryOrderRequest(
        @NotEmpty List<Long> orderedIds
) {}
