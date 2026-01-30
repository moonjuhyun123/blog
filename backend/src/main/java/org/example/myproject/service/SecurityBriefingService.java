package org.example.myproject.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.rometools.rome.feed.synd.*;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.net.URLConnection;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;

@Service
public class SecurityBriefingService {

    private static final Logger log = LoggerFactory.getLogger(SecurityBriefingService.class);

    static final ZoneId KST = ZoneId.of("Asia/Seoul");

    static final String GEMINI_MODEL = "gemini-2.5-flash";

    static final int MAX_ITEMS_PER_FEED = 5000;
    static final int MAX_TOTAL_ITEMS    = 50000;

    static final int CONNECT_TIMEOUT_MS = 10_000;
    static final int READ_TIMEOUT_MS    = 25_000;
    static final int RETRY              = 2;

    static final int MAX_CONTENT_CHARS_IN_PROMPT_PER_ITEM = 4000;

    static final Duration LOOKBACK_WINDOW = Duration.ofHours(36);

    // content 너무 짧으면 “보안 설명 없음”으로 보고 제외(프롬프트 룰과도 일치)
    static final int MIN_MEANINGFUL_CONTENT_CHARS = 80;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    public record FeedItemNorm(
            String source,
            String title,
            String link,
            Instant publishedAt,
            String content
    ) {}

    public String generateBriefingHtml() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("환경변수/설정(gemini.api-key)에 GEMINI API KEY가 없습니다.");
        }

        long t0 = System.currentTimeMillis();
        Instant now = Instant.now();
        Instant cutoff = now.minus(LOOKBACK_WINDOW);

        log.info("[briefing] start model={} lookbackHours={} cutoffUtc={}",
                GEMINI_MODEL, LOOKBACK_WINDOW.toHours(), cutoff);

        Client client = Client.builder()
                .apiKey(geminiApiKey)
                .build();

        List<String> feeds = List.of(
                "https://feeds.feedburner.com/TheHackersNews",
                "https://www.bleepingcomputer.com/feed/",
                "https://www.darkreading.com/rss.xml",
                "https://knvd.krcert.or.kr/rss/securityNotice.do",
                "https://www.securityweek.com/feed/",
                "https://feeds.feedburner.com/feedburner/Talos",
                "https://www.helpnetsecurity.com/feed/",
                "https://www.infosecurity-magazine.com/rss/news/",
                "https://www.boannews.com/media/news_rss.xml",
                "https://www.dailysecu.com/rss/clickTop.xml",
                "https://www.reddit.com/r/netsec/.rss",
                "https://grahamcluley.com/feed/",
                "https://www.welivesecurity.com/en/rss/feed/",
                "https://securelist.com/feed/",
                "https://www.mandiant.com/resources/blog/rss.xml",
                "https://www.microsoft.com/en-us/security/blog/feed/",
                "https://www.malwarebytes.com/blog/feed",
                "https://securityaffairs.co/wordpress/feed",
                "https://www.cisa.gov/cybersecurity-advisories/all.xml"
        );

        List<FeedItemNorm> items = collectFeeds(feeds);

        log.info("[briefing] collected totalItems={} elapsedMs={}", items.size(), (System.currentTimeMillis() - t0));

        if (items.isEmpty()) {
            log.warn("[briefing] no items collected. returning failure html.");
            return "<article><h1>보안 브리핑 생성 실패</h1><p>정보 부족: 수집된 뉴스가 없습니다.</p></article>";
        }

        String prompt = buildPrompt(items);
        log.info("[briefing] prompt built itemsInPrompt={} promptChars={}",
                items.size(), prompt.length());

        GenerateContentResponse response;
        long t1 = System.currentTimeMillis();
        try {
            log.info("[briefing] gemini call start model={} promptChars={}", GEMINI_MODEL, prompt.length());
            response = client.models.generateContent(GEMINI_MODEL, prompt, null);
            log.info("[briefing] gemini call done elapsedMs={}", (System.currentTimeMillis() - t1));
        } catch (Exception e) {
            log.error("[briefing] gemini call failed elapsedMs={} msg={}",
                    (System.currentTimeMillis() - t1), e.getMessage(), e);
            throw new RuntimeException("Gemini 호출 실패: " + e.getMessage(), e);
        }

        String html = response.text();
        if (html == null || html.isBlank()) {
            log.warn("[briefing] gemini response empty. returning failure html.");
            return "<article><h1>보안 브리핑 생성 실패</h1><p>정보 부족: 모델 응답이 비어 있습니다.</p></article>";
        }

        String trimmed = html.trim();
        log.info("[briefing] success htmlChars={} totalElapsedMs={}",
                trimmed.length(), (System.currentTimeMillis() - t0));
        return trimmed;
    }

    // ==========================================================
    // RSS 수집 + 로그
    // ==========================================================
    static List<FeedItemNorm> collectFeeds(List<String> feedUrls) {
        long t0 = System.currentTimeMillis();

        List<FeedItemNorm> allItems = new ArrayList<>();
        Set<String> seenLinks = new HashSet<>(100_000);

        Instant now = Instant.now();
        Instant cutoff = now.minus(LOOKBACK_WINDOW);

        int feedOk = 0;
        int feedFail = 0;

        int skippedOld = 0;
        int skippedDup = 0;
        int skippedNoDate = 0;
        int skippedEmpty = 0;

        for (String url : feedUrls) {
            long tf = System.currentTimeMillis();
            try {
                SyndFeed feed = fetchFeedWithRetry(url);
                feedOk++;

                String source = nonBlank(feed.getTitle(), url);

                int added = 0;
                int scanned = 0;

                for (SyndEntry e : feed.getEntries()) {
                    scanned++;

                    FeedItemNorm norm = toNorm(source, e);
                    if (norm == null) {
                        skippedEmpty++;
                        continue;
                    }

                    Instant publishedAt = norm.publishedAt();
                    if (publishedAt == null) {
                        skippedNoDate++;
                        continue;
                    }
                    if (publishedAt.isBefore(cutoff)) {
                        skippedOld++;
                        continue;
                    }

                    // “본문이 의미없음”은 제외 (프롬프트 룰: content 빈/의미없으면 제외)
                    String content = norm.content();
                    if (content == null || content.isBlank() || content.length() < MIN_MEANINGFUL_CONTENT_CHARS) {
                        skippedEmpty++;
                        continue;
                    }

                    String link = norm.link();
                    if (!blank(link)) {
                        if (!seenLinks.add(link)) {
                            skippedDup++;
                            continue;
                        }
                    }

                    allItems.add(norm);
                    added++;

                    if (added >= MAX_ITEMS_PER_FEED) break;
                    if (allItems.size() >= MAX_TOTAL_ITEMS) break;
                }

                log.info("[rss] ok source='{}' url={} scanned={} added={} elapsedMs={}",
                        source, url, scanned, added, (System.currentTimeMillis() - tf));

                if (allItems.size() >= MAX_TOTAL_ITEMS) {
                    log.warn("[rss] reached MAX_TOTAL_ITEMS={}, stop collecting.", MAX_TOTAL_ITEMS);
                    break;
                }

            } catch (Exception e) {
                feedFail++;
                log.warn("[rss] fail url={} elapsedMs={} msg={}",
                        url, (System.currentTimeMillis() - tf), e.getMessage());
            }
        }

        allItems.sort(Comparator.comparing(
                FeedItemNorm::publishedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        log.info("[rss] done feedsOk={} feedsFail={} total={} skippedOld={} skippedDup={} skippedNoDate={} skippedEmpty={} elapsedMs={}",
                feedOk, feedFail, allItems.size(), skippedOld, skippedDup, skippedNoDate, skippedEmpty,
                (System.currentTimeMillis() - t0));

        if (allItems.size() > MAX_TOTAL_ITEMS) {
            return allItems.subList(0, MAX_TOTAL_ITEMS);
        }
        return allItems;
    }

    static SyndFeed fetchFeedWithRetry(String feedUrl) throws Exception {
        Exception last = null;
        for (int i = 0; i <= RETRY; i++) {
            try {
                if (i > 0) {
                    log.debug("[rss] retry={} url={}", i, feedUrl);
                }
                return fetchFeed(feedUrl);
            } catch (Exception e) {
                last = e;
                try { Thread.sleep(300L * (i + 1)); } catch (InterruptedException ignored) {}
            }
        }
        throw last;
    }

    static SyndFeed fetchFeed(String feedUrl) throws Exception {
        URLConnection conn = new URL(feedUrl).openConnection();
        conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        conn.setRequestProperty("Accept", "application/rss+xml, application/xml;q=0.9, */*;q=0.8");
        conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
        conn.setReadTimeout(READ_TIMEOUT_MS);

        try (XmlReader reader = new XmlReader(conn)) {
            return new SyndFeedInput().build(reader);
        }
    }

    static FeedItemNorm toNorm(String source, SyndEntry e) {
        String title = safe(e.getTitle());
        String link  = safe(e.getLink());

        if (blank(title) && blank(link)) return null;

        Instant publishedAt = extractPublishedAt(e);

        String contentHtml = null;
        if (e.getContents() != null && !e.getContents().isEmpty() && e.getContents().get(0) != null) {
            contentHtml = e.getContents().get(0).getValue();
        }
        String summaryHtml = (e.getDescription() != null) ? e.getDescription().getValue() : null;

        String picked = pickBody(contentHtml, summaryHtml);
        String cleaned = cleanText(picked);

        return new FeedItemNorm(
                source,
                title,
                link,
                publishedAt,
                cleaned
        );
    }

    static Instant extractPublishedAt(SyndEntry e) {
        if (e.getPublishedDate() != null) return e.getPublishedDate().toInstant();
        if (e.getUpdatedDate() != null) return e.getUpdatedDate().toInstant();
        return null;
    }

    static String pickBody(String contentHtml, String summaryHtml) {
        String c = cleanText(contentHtml);
        String s = cleanText(summaryHtml);

        if (c.length() >= 200) return c;
        if (!blank(s)) return s;
        return c;
    }

    static String buildPrompt(List<FeedItemNorm> items) {
        StringBuilder sb = new StringBuilder();

        String yesterdayBriefingText = "없음";
        StringBuilder todayItems = new StringBuilder();
        int i = 1;
        for (FeedItemNorm item : items) {
            String content = item.content();
            if (content == null) content = "";

            if (content.length() > MAX_CONTENT_CHARS_IN_PROMPT_PER_ITEM) {
                content = content.substring(0, MAX_CONTENT_CHARS_IN_PROMPT_PER_ITEM) + "\n...[TRUNCATED]...";
            }

            todayItems.append("[").append(i++).append("]\n");
            todayItems.append("source: ").append(item.source()).append("\n");
            todayItems.append("title: ").append(item.title()).append("\n");
            todayItems.append("url: ").append(item.link()).append("\n");
            todayItems.append("publishedAt(UTC): ").append(item.publishedAt()).append("\n");
            todayItems.append("content:\n").append(content).append("\n");
            todayItems.append("----\n\n");
        }

        sb.append("너는 베테랑 보안 뉴스 편집자이자 보안 실무자를 위한 브리핑 작성 전문가다.\n");
        sb.append("목표: 아래 '오늘 뉴스 item'만을 근거로, 사람이 읽기 좋은 블로그용 단일 HTML(<article>) 문서를 생성하라.\n\n");

        sb.append("[최우선 규칙: 환각 절대 금지]\n");
        sb.append("- 입력 데이터(item)의 title, content에 명시되지 않은 사실을 절대 생성하지 마라.\n");
        sb.append("- CVE 번호, CVSS 점수, \"actively exploited\", \"in-the-wild\", 공격 주체(APT/국가), 기한, 기관 지시는\n");
        sb.append("  반드시 item content에 명시된 경우에만 사용하라.\n");
        sb.append("- 기사에 명시되지 않은 정보는 추정하거나 보완하지 말고 반드시 다음 중 하나로 표기하라:\n");
        sb.append("  \"기사에 명시 없음\", \"확인 불가\", \"정보 부족\"\n\n");

        sb.append("[데이터 사용 제한 규칙]\n");
        sb.append("- content가 비어 있거나, 의미 있는 보안 설명이 없는 item은 분석 대상에서 제외하라.\n");
        sb.append("- 제목만 있고 본문(content)이 없는 항목은 사용하지 마라.\n");
        sb.append("- 단순 공지/이벤트 안내/채용/행사/마케팅성 글은 제외하라.\n\n");

        sb.append("[사건(Event) 단위 강제]\n");
        sb.append("- 각 Top 사건은 반드시 하나의 '사건(Event)'을 설명해야 한다.\n");
        sb.append("- 사건은 아래 중 하나로 식별 가능해야 한다(최소 1개 충족, 없으면 Top에서 제외):\n");
        sb.append("  • CVE 번호\n");
        sb.append("  • 특정 제품명 + 취약점 유형(예: Product X RCE)\n");
        sb.append("  • 공격 캠페인 또는 위협 그룹/작전명\n");
        sb.append("- \"~전반\", \"~동향\", \"~위협 증가\" 같은 포괄적/추상적 사건 제목은 금지한다.\n\n");

        sb.append("[출력 대상 및 수량]\n");
        sb.append("- Top 3 사건만 출력하라.\n");
        sb.append("- 유효 사건이 3개 미만이면: HTML 대신 아래 실패 HTML만 출력하라(다른 텍스트 금지):\n");
        sb.append("  <article><h1>보안 브리핑 생성 실패</h1><p>정보 부족: 유효 사건 수가 기준(3개)을 충족하지 못했습니다.</p></article>\n\n");

        sb.append("[HTML 안전 규칙]\n");
        sb.append("- 출력은 반드시 <article> 하나로 감싼 '단일 HTML 문서'여야 한다.\n");
        sb.append("- Markdown, 코드펜스, 설명 문장, 서문/후기 텍스트를 절대 출력하지 마라.\n");
        sb.append("- 허용 태그: article, section, header, h1, h2, h3, p, ul, ol, li, a, strong, em, code\n");
        sb.append("- 금지: script, style, iframe, img, 모든 on* 이벤트 속성\n");
        sb.append("- 링크(<a>)는 반드시 오늘 item의 URL만 사용하며, target=\"_blank\" rel=\"noopener noreferrer\"를 포함하라.\n\n");

        sb.append("[언어]\n");
        sb.append("- 전체 출력은 한국어로 작성하되, 아래 전문 용어는 번역하지 말고 원어를 유지하라:\n");
        sb.append("  CVE, CVSS, RCE, LPE, APT, Zero-day, Exploit, Patch, Mitigation,\n");
        sb.append("  Phishing, Malware, Ransomware, Supply Chain, C2, IOC\n\n");

        sb.append("============================================================\n");
        sb.append("[전날 브리핑(임의 문자열, 근거로 사용 금지)]\n");
        sb.append(yesterdayBriefingText).append("\n");
        sb.append("============================================================\n\n");

        sb.append("============================================================\n");
        sb.append("[오늘 뉴스 item 목록 — 이 데이터만이 사실 근거다]\n");
        sb.append("각 item 형식: [번호] title | link | publishedAt | source | content\n");
        sb.append("============================================================\n");
        sb.append(todayItems).append("\n");

        sb.append("[최종 HTML 구조 — 순서/태그 변경 금지]\n");
        sb.append("- 아래 템플릿을 그대로 복사하여 출력하라.\n");
        sb.append("- 태그, 헤딩 문구, 섹션 순서, 번호(1/2/3/4), 문장 구조를 절대 변경하지 마라.\n");
        sb.append("- 너는 {중괄호} 안의 값만 채워라.\n\n");

        sb.append("!!! 절대 규칙 !!!\n");
        sb.append("- 아래 템플릿의 태그/문구/번호/섹션 순서를 한 글자도 변경하지 마라.\n");
        sb.append("- 관련 링크는 5개 이하로 고정해라, header의 h1은 오늘의 보안 브리핑 고정이다.\n");
        sb.append("- 동의어로 바꾸기 금지.\n");
        sb.append("- 출력은 템플릿을 그대로 복사하고 { } 안의 값만 채운 HTML만 출력하라.\n\n");

        sb.append("BEGIN_HTML_TEMPLATE\n");
        sb.append("<article>\n");
        sb.append("  <header>\n");
        sb.append("    <h1>오늘의 보안 브리핑 (Top 3 사건)</h1>\n");
        sb.append("    <p>1) {1번 사건 한 문장 요약}</p>\n");
        sb.append("    <p>2) {2번 사건 한 문장 요약}</p>\n");
        sb.append("    <p>3) {3번 사건 한 문장 요약}</p>\n");
        sb.append("  </header>\n");

        sb.append("  <section>\n");
        sb.append("    <h2>1. {사건 제목}</h2>\n");
        sb.append("    <p><strong>개요:</strong> {2문장 이내 요약}</p>\n");
        sb.append("    <h3>1. 주요내용</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>2. 권고 조치사항</h3>\n");
        sb.append("    <ol>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("    </ol>\n");
        sb.append("    <h3>3. 취약점 정보</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><strong>CVE:</strong> {번호 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("      <li><strong>CVSS:</strong> {점수 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>4. 관련 링크</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><a href=\"{URL}\" target=\"_blank\" rel=\"noopener noreferrer\">{URL}</a></li>\n");
        sb.append("    </ul>\n");
        sb.append("  </section>\n");

        sb.append("  <section>\n");
        sb.append("    <h2>2. {사건 제목}</h2>\n");
        sb.append("    <p><strong>개요:</strong> {2문장 이내 요약}</p>\n");
        sb.append("    <h3>1. 주요내용</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>2. 권고 조치사항</h3>\n");
        sb.append("    <ol>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("    </ol>\n");
        sb.append("    <h3>3. 취약점 정보</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><strong>CVE:</strong> {번호 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("      <li><strong>CVSS:</strong> {점수 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>4. 관련 링크</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><a href=\"{URL}\" target=\"_blank\" rel=\"noopener noreferrer\">{URL}</a></li>\n");
        sb.append("    </ul>\n");
        sb.append("  </section>\n");

        sb.append("  <section>\n");
        sb.append("    <h2>3. {사건 제목}</h2>\n");
        sb.append("    <p><strong>개요:</strong> {2문장 이내 요약}</p>\n");
        sb.append("    <h3>1. 주요내용</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("      <li>{사실 기반 리스트}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>2. 권고 조치사항</h3>\n");
        sb.append("    <ol>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("      <li>{행동 가능한 항목}</li>\n");
        sb.append("    </ol>\n");
        sb.append("    <h3>3. 취약점 정보</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><strong>CVE:</strong> {번호 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("      <li><strong>CVSS:</strong> {점수 또는 \"기사에 명시 없음\"}</li>\n");
        sb.append("    </ul>\n");
        sb.append("    <h3>4. 관련 링크</h3>\n");
        sb.append("    <ul>\n");
        sb.append("      <li><a href=\"{URL}\" target=\"_blank\" rel=\"noopener noreferrer\">{URL}</a></li>\n");
        sb.append("    </ul>\n");
        sb.append("  </section>\n");

        sb.append("</article>\n");
        sb.append("END_HTML_TEMPLATE\n\n");

        sb.append("최종 출력 규칙: BEGIN_HTML_TEMPLATE와 END_HTML_TEMPLATE 사이의 HTML만 출력하라. 다른 텍스트는 절대 출력하지 마라.\n");
        sb.append("이제 오늘 item만 근거로 위 템플릿의 { } 값만 채워서 출력하라.\n");

        return sb.toString();
    }

    static String cleanText(String html) {
        if (html == null) return "";
        return html
                .replaceAll("(?is)<script.*?>.*?</script>", " ")
                .replaceAll("(?is)<style.*?>.*?</style>", " ")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    static boolean blank(String s) {
        return s == null || s.trim().isEmpty();
    }

    static String safe(String s) {
        return (s == null) ? "" : s.trim();
    }

    static String nonBlank(String... values) {
        for (String v : values) {
            if (!blank(v)) return v.trim();
        }
        return "";
    }
}
