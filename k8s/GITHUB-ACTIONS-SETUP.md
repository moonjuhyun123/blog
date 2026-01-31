# GitHub Actions CI/CD 설정 가이드

GitHub Actions를 사용하여 자동으로 빌드하고 K3s 서버에 배포하는 방법입니다.

---

## 📋 워크플로우 개요

```
Push to main/master
    ↓
Build Backend (Maven + Docker)
    ↓
Build Frontend (Node + Docker)
    ↓
Push to GitHub Container Registry (GHCR)
    ↓
Deploy to K3s Server (SSH)
```

---

## 🔧 사전 준비

### 1. K3s 서버 설정

**8GB K3s 서버에서 실행:**

```bash
# 1. SSH 키 생성 (GitHub Actions용)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
# 비밀번호 없이 생성 (Enter 2번)

# 2. 공개키를 authorized_keys에 추가
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# 3. 개인키 내용 복사 (GitHub Secrets에 사용)
cat ~/.ssh/github-actions
# -----BEGIN OPENSSH PRIVATE KEY----- 부터
# -----END OPENSSH PRIVATE KEY----- 까지 전체 복사

# 4. SSH 서버 확인
sudo systemctl status sshd

# 5. K3s 서버 IP 확인
ip addr show | grep "inet "
# 예: 172.30.1.101
```

### 2. 4GB DB 서버 확인

DB 서버 IP: **172.30.1.85** (이미 설정됨)

```bash
# 4GB 서버에서 확인
sudo netstat -tlnp | grep 3306
# 0.0.0.0:3306 으로 리스닝 확인

# blog 데이터베이스와 사용자 확인
sudo mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='blog_user';"
```

---

## 🔐 GitHub Secrets 설정

### GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 4개의 Secret을 추가하세요:

| Secret 이름      | 값                                             | 설명                |
| -------------- | --------------------------------------------- | ----------------- |
| `K3S_HOST`     | `172.30.1.101`                                | K3s 서버 IP         |
| `K3S_USER`     | `your-username`                               | K3s 서버 SSH 사용자명  |
| `K3S_SSH_KEY`  | `-----BEGIN OPENSSH PRIVATE KEY-----\n...`    | SSH 개인키 (전체 내용)   |
| `DB_PASSWORD`  | `MySecurePassword123!`                        | DB 비밀번호          |

### Secret 추가 방법:

1. GitHub 저장소 페이지 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴: **Secrets and variables** → **Actions**
4. **New repository secret** 버튼 클릭
5. Name과 Secret 입력 후 **Add secret**

---

## 📦 GitHub Container Registry 활성화

### 1. GHCR 패키지 권한 설정

GitHub Actions가 자동으로 GHCR에 이미지를 푸시합니다.

첫 배포 후:

1. GitHub 프로필 → **Packages** 탭
2. `blog/backend`, `blog/frontend` 패키지 클릭
3. **Package settings**
4. **Change visibility** → Public (또는 Private 유지)
5. **Manage Actions access** → Write 권한 확인

### 2. K3s 서버에서 GHCR 접근 (Public 패키지는 불필요)

Private 패키지인 경우:

```bash
# K3s 서버에서 수동으로 생성 (GitHub Actions가 자동으로 생성하므로 선택사항)
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

**GitHub Token 생성:**
- GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- Repository access: 본인 저장소 선택
- Permissions: **Packages** → Read

---

## 🚀 배포 방법

### 자동 배포 (권장)

```bash
# 코드 변경 후 main 브랜치에 푸시
git add .
git commit -m "Update application"
git push origin main

# GitHub Actions가 자동으로:
# 1. 빌드
# 2. Docker 이미지 생성 및 푸시
# 3. K3s 서버에 배포
```

### 수동 배포

GitHub 저장소 → **Actions** 탭 → **CI/CD** 워크플로우 → **Run workflow**

---

## 📊 배포 확인

### 1. GitHub Actions 로그 확인

1. GitHub 저장소 → **Actions** 탭
2. 최근 워크플로우 실행 클릭
3. `build-backend`, `build-frontend`, `deploy` 단계 확인

### 2. K3s 서버에서 확인

**8GB 서버에서 실행:**

```bash
# Pod 상태 확인
kubectl get pods

# 백엔드 로그
kubectl logs -f deployment/blog-backend

# 프론트엔드 로그
kubectl logs -f deployment/blog-frontend

# 리소스 사용량
kubectl top nodes
kubectl top pods
```

### 3. 배포된 이미지 확인

```bash
# K3s에서 현재 사용 중인 이미지 확인
kubectl get deployment blog-backend -o jsonpath='{.spec.template.spec.containers[0].image}'
kubectl get deployment blog-frontend -o jsonpath='{.spec.template.spec.containers[0].image}'
```

---

## 🛠️ 트러블슈팅

### 문제 1: SSH 연결 실패

**증상:**
```
Permission denied (publickey)
```

**해결:**

```bash
# K3s 서버에서 authorized_keys 확인
cat ~/.ssh/authorized_keys | grep github-actions

# SSH 키 권한 확인
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# K3S_SSH_KEY Secret이 정확한지 확인
# 전체 내용이 포함되어야 함:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

### 문제 2: ImagePullBackOff

**증상:**
```
Failed to pull image "ghcr.io/...": unauthorized
```

**해결:**

```bash
# 1. GitHub 패키지 권한 확인
# GitHub → Packages → blog/backend → Settings → Manage Actions access

# 2. K3s에서 Secret 확인
kubectl get secret ghcr-secret
kubectl describe secret ghcr-secret

# 3. Secret 재생성 (GitHub Actions가 자동으로 생성)
# 또는 수동으로:
kubectl delete secret ghcr-secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN
```

### 문제 3: DB 연결 실패

**증상:**
```
Communications link failure
```

**해결:**

```bash
# 1. K3s 서버에서 DB 연결 테스트
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h 172.30.1.85 -u blog_user -p -e "SHOW DATABASES;"

# 2. ConfigMap 확인
kubectl get configmap blog-db-config -o yaml

# 3. Secret 확인 (비밀번호)
kubectl get secret blog-db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# 4. 방화벽 확인 (4GB 서버)
sudo ufw status
sudo ufw allow from <K3s-서버-IP> to any port 3306
```

### 문제 4: 배포가 느리거나 실패

**증상:**
```
Waiting for rollout... (timeout)
```

**해결:**

```bash
# 1. Pod 상태 확인
kubectl get pods
kubectl describe pod <pod-name>

# 2. 리소스 부족 확인
kubectl top nodes
kubectl top pods

# 3. 이전 배포 확인
kubectl get deployment

# 4. 롤백
kubectl rollout undo deployment/blog-backend
```

### 문제 5: Maven 빌드 실패 (GitHub Actions)

**증상:**
```
[ERROR] Failed to execute goal
```

**해결:**

1. 로컬에서 빌드 테스트:
```bash
cd backend
mvn clean package -DskipTests
```

2. `pom.xml` 확인
3. 테스트 스킵: `-DskipTests` 플래그 확인

---

## 🔄 워크플로우 커스터마이징

### 특정 브랜치만 배포

`.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches: ["main"]  # main만 배포
```

### 배포 단계 건너뛰기

```yaml
deploy:
  if: github.ref == 'refs/heads/main' && !contains(github.event.head_commit.message, '[skip deploy]')
```

커밋 메시지에 `[skip deploy]` 포함 시 배포 건너뜀:

```bash
git commit -m "Update README [skip deploy]"
```

### 수동 승인 추가

```yaml
deploy:
  needs: [build-backend, build-frontend]
  environment: production  # Environments 설정 필요
```

GitHub → Settings → Environments → New environment → `production` → Required reviewers 설정

---

## 📝 체크리스트

배포 전:

- [ ] GitHub Secrets 4개 설정 완료 (K3S_HOST, K3S_USER, K3S_SSH_KEY, DB_PASSWORD)
- [ ] K3s 서버에 SSH 키 설정
- [ ] 4GB DB 서버에서 blog 데이터베이스 준비
- [ ] GitHub Container Registry 활성화

배포 후:

- [ ] GitHub Actions 워크플로우 성공
- [ ] Pod가 모두 Running 상태
- [ ] 백엔드 로그에서 DB 연결 성공 확인
- [ ] 프론트엔드 정상 작동 확인

---

## 🎯 워크플로우 파일 구조

```
.github/workflows/ci.yml
├── build-backend       # Maven 빌드 → Docker → GHCR 푸시
├── build-frontend      # Next.js 빌드 → Docker → GHCR 푸시
└── deploy              # K3s 서버에 배포
    ├── SSH 연결 설정
    ├── GHCR 인증 Secret 생성
    ├── DB Secret 생성
    ├── ConfigMap 적용
    ├── Backend 배포
    ├── Frontend 배포
    └── Rollout 확인
```

---

## 💡 장점

1. **자동화**: 코드 푸시 시 자동 빌드 및 배포
2. **일관성**: 항상 같은 방식으로 배포
3. **추적 가능**: GitHub Actions 로그로 모든 배포 기록 확인
4. **롤백 용이**: 이전 워크플로우 재실행으로 쉽게 롤백
5. **보안**: Secrets로 민감한 정보 관리

---

## 🔗 참고 링크

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [K3s 문서](https://docs.k3s.io/)

---

**마지막 업데이트**: 2026-01-31
**DB 서버 IP**: 172.30.1.85
**환경**: 4GB DB 서버 + 8GB K3s 서버
