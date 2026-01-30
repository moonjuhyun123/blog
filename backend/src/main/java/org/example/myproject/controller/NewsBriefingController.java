package org.example.myproject.controller;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.news.NewsBriefingDto;
import org.example.myproject.service.NewsBriefingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/news")
public class NewsBriefingController {

    private final NewsBriefingService newsBriefings;

    @GetMapping
    public ResponseEntity<List<NewsBriefingDto>> list(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false, name = "q") String query
    ) {
        LocalDate fromDate = (from == null || from.isBlank()) ? null : LocalDate.parse(from.trim());
        LocalDate toDate = (to == null || to.isBlank()) ? null : LocalDate.parse(to.trim());
        return ResponseEntity.ok(newsBriefings.list(fromDate, toDate, query));
    }

    @GetMapping("/{date}")
    public ResponseEntity<NewsBriefingDto> getByDate(@PathVariable String date) {
        LocalDate briefingDate = LocalDate.parse(date);
        return ResponseEntity.ok(newsBriefings.getByDate(briefingDate));
    }
}
