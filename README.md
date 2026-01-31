# Blog Application

Spring Boot + Next.js 기반 블로그 애플리케이션

## 프로젝트 구조

```
blog/
├── backend/              # Spring Boot API 서버
├── next-seo/            # Next.js 프론트엔드
├── k8s/                 # Kubernetes 배포 매니페스트
├── Dockerfile.backend   # 백엔드 Docker 이미지
├── Dockerfile.frontend  # 프론트엔드 Docker 이미지
└── .github/workflows/   # CI/CD 설정
```

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.5
- Spring Security + JWT
- JPA + MariaDB/H2
- Flexmark (Markdown)
- Google Gemini AI

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tiptap Editor
- Server-Side Rendering (SSR)

## 로컬 개발

### Backend

```bash
cd backend
mvn spring-boot:run
```

기본 포트: `8080`

### Frontend

```bash
cd next-seo
npm install
npm run dev
```

기본 포트: `3000`

환경 변수: `.env.example` 파일을 `.env.local`로 복사하고 수정

## 배포

### Docker로 빌드

```bash
# 백엔드
cd backend && mvn clean package
cd ..
docker build -f Dockerfile.backend -t blog-backend .

# 프론트엔드
docker build -f Dockerfile.frontend -t blog-frontend .
```

### Kubernetes 배포

자세한 내용은 [k8s/README.md](k8s/README.md)를 참고하세요.

```bash
kubectl apply -f k8s/
```

## CI/CD

GitHub Actions를 사용하여 자동 빌드 및 배포:

- `main` 브랜치에 push 시 자동 실행
- Docker 이미지 빌드 및 GitHub Container Registry에 푸시
- 백엔드와 프론트엔드 별도 빌드

## API 문서

백엔드 실행 후 Swagger UI에서 확인:
- URL: `http://localhost:8080/swagger-ui.html`

## 주요 기능

- 사용자 인증 (JWT, Google OAuth)
- 게시글 작성/수정/삭제 (Markdown)
- 카테고리 관리
- 댓글 시스템
- 좋아요 기능
- 보안 뉴스 브리핑 (AI 생성)
- 방문자 통계
- SEO 최적화 (Next.js SSR)

## 라이선스

MIT License
