# 배포 설정 완료 요약

## ✅ 완료된 작업

### 1. Database 설정
- **DB 서버 IP**: `172.30.1.85` (4GB 서버)
- `database-config.yaml` 업데이트 완료

### 2. GitHub Actions CI/CD 구성
- **.github/workflows/ci.yml** 업데이트 완료
  - 백엔드 빌드 (Maven + Docker)
  - 프론트엔드 빌드 (Node + Docker)
  - K3s 자동 배포

### 3. K8s 매니페스트 수정
- `backend-deployment.yaml`: GHCR 이미지 사용, replicas=1
- `frontend-deployment.yaml`: GHCR 이미지 사용, replicas=1
- imagePullSecrets 활성화

### 4. 문서 생성
- ✅ `CICD-QUICKSTART.md` - 5분 빠른 시작
- ✅ `GITHUB-ACTIONS-SETUP.md` - 상세 설정 가이드
- ✅ `DEPLOY-GUIDE.md` - 수동 배포 가이드
- ✅ `QUICK-REFERENCE.md` - 명령어 참조
- ✅ `DEPLOYMENT-SUMMARY.md` - 이 파일
- ✅ `README.md` 업데이트

---

## 🎯 다음 단계

### Step 1: K3s 서버에서 SSH 키 생성

**8GB K3s 서버에 SSH 접속:**

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# 공개키를 authorized_keys에 추가
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 개인키 확인 및 복사
cat ~/.ssh/github-actions
```

전체 내용을 복사하세요:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 2: GitHub Secrets 설정

**GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret**

추가할 4개의 Secrets:

| Name | Value | 예시 |
|------|-------|------|
| `K3S_HOST` | 8GB K3s 서버 IP | `172.30.1.101` |
| `K3S_USER` | SSH 사용자명 | `username` |
| `K3S_SSH_KEY` | SSH 개인키 전체 | `-----BEGIN...END-----` |
| `DB_PASSWORD` | DB 비밀번호 | `MySecure123!` |

### Step 3: 첫 배포

**Windows PC에서:**

```bash
cd C:\Users\moonj\Desktop\blog

# 변경사항 커밋
git add .
git commit -m "Setup GitHub Actions CI/CD"

# GitHub에 푸시
git push origin main
```

### Step 4: 배포 확인

1. **GitHub에서**: 저장소 → Actions 탭 → 워크플로우 확인
2. **K3s 서버에서**:
   ```bash
   kubectl get pods
   kubectl logs -f deployment/blog-backend
   kubectl logs -f deployment/blog-frontend
   ```

---

## 📋 사전 준비 체크리스트

### 4GB DB 서버 (172.30.1.85)
- [ ] MariaDB 설치 및 실행
- [ ] blog 데이터베이스 생성
- [ ] blog_user 사용자 생성 및 권한 부여
- [ ] bind-address = 0.0.0.0 설정
- [ ] 방화벽 3306 포트 허용
- [ ] 8GB 서버에서 연결 테스트 완료

### 8GB K3s 서버
- [ ] k3s 설치 및 실행
- [ ] kubectl 명령어 사용 가능
- [ ] SSH 서버 실행
- [ ] github-actions SSH 키 생성
- [ ] authorized_keys에 공개키 추가

### GitHub
- [ ] 저장소 생성 또는 기존 저장소 사용
- [ ] Actions 활성화
- [ ] 4개의 Secrets 추가

---

## 🔄 일상적인 사용 흐름

```bash
# 1. 코드 수정
# 2. 로컬 테스트
# 3. 커밋 및 푸시
git add .
git commit -m "Add new feature"
git push origin main

# 4. GitHub Actions 자동 실행
#    - 빌드 (2-3분)
#    - 배포 (1-2분)

# 5. K3s 서버에서 확인
kubectl get pods
kubectl logs -f deployment/blog-backend
```

---

## 🌐 워크플로우 흐름

```
┌─────────────────┐
│  git push main  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│    GitHub Actions Trigger       │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Backend │ │Frontend  │
│Build   │ │Build     │
└────┬───┘ └───┬──────┘
     │         │
     └────┬────┘
          │
          ▼
     ┌────────┐
     │ Push to│
     │  GHCR  │
     └────┬───┘
          │
          ▼
     ┌──────────┐
     │  Deploy  │
     │ to K3s   │
     └────┬─────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌─────────┐  ┌──────────┐
│Backend  │  │Frontend  │
│Pod      │  │Pod       │
└─────────┘  └──────────┘
```

---

## 📊 배포 환경 구성

```
┌─────────────────────────────────────────┐
│  GitHub Container Registry (GHCR)       │
│  - ghcr.io/owner/repo/backend:latest    │
│  - ghcr.io/owner/repo/frontend:latest   │
└───────────────┬─────────────────────────┘
                │ Pull Images
                ▼
┌─────────────────────────────────────────┐
│  8GB K3s Server (172.30.1.XXX)          │
│  ┌─────────────────────────────────┐   │
│  │  K3s Cluster                    │   │
│  │  ├── blog-backend Pod           │   │
│  │  └── blog-frontend Pod          │   │
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │ TCP 3306
                ▼
┌─────────────────────────────────────────┐
│  4GB DB Server (172.30.1.85)            │
│  - MariaDB/MySQL                        │
│  - blog Database                        │
└─────────────────────────────────────────┘
```

---

## 🛠️ 자주 사용하는 명령어

### 배포 상태 확인
```bash
# GitHub Actions
# GitHub → Actions 탭 → 최근 워크플로우

# K3s Pod 상태
kubectl get pods

# 실시간 로그
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend
```

### 문제 해결
```bash
# Pod 상세 정보
kubectl describe pod <pod-name>

# Secret 확인
kubectl get secret blog-db-secret -o yaml

# ConfigMap 확인
kubectl get configmap blog-db-config -o yaml

# 재배포
kubectl rollout restart deployment/blog-backend
```

---

## 📚 문서 가이드

| 문서 | 용도 | 대상 |
|------|------|------|
| [CICD-QUICKSTART.md](../CICD-QUICKSTART.md) | 5분 빠른 시작 | 처음 사용자 |
| [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md) | GitHub Actions 상세 설정 | 관리자 |
| [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md) | 수동 배포 방법 | DevOps |
| [QUICK-REFERENCE.md](QUICK-REFERENCE.md) | 명령어 참조 | 개발자 |
| [README-k3s.md](README-k3s.md) | K3s 가이드 | K3s 사용자 |

---

## ✅ 성공 확인 방법

### 1. GitHub Actions
- Actions 탭에서 워크플로우가 녹색 체크(✅)로 완료
- 모든 단계(build-backend, build-frontend, deploy)가 성공

### 2. K3s
```bash
kubectl get pods
# 모두 Running 상태

kubectl logs deployment/blog-backend | grep "Started"
# "Started Application in X seconds" 확인

kubectl logs deployment/blog-frontend
# "Ready" 또는 "Listening on port 3000" 확인
```

### 3. 애플리케이션
```bash
# 포트 포워딩으로 테스트
kubectl port-forward svc/blog-backend 8080:8080
curl http://localhost:8080/actuator/health
# {"status":"UP"} 응답

kubectl port-forward svc/blog-frontend 3000:3000
# 브라우저: http://localhost:3000
```

---

## 🎉 완료!

이제 GitHub에 코드를 푸시하면 자동으로 K3s에 배포됩니다.

### 첫 배포 시작하기:

1. GitHub Secrets 4개 설정
2. `git push origin main`
3. GitHub Actions 탭에서 진행 상황 확인
4. 2-5분 후 배포 완료!

---

**질문이나 문제가 있으면 각 가이드 문서의 트러블슈팅 섹션을 참고하세요.**

- CICD 문제: [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md#트러블슈팅)
- K8s 문제: [QUICK-REFERENCE.md](QUICK-REFERENCE.md#트러블슈팅)
- 배포 문제: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md#트러블슈팅)
