# CI/CD 빠른 시작 가이드

## 🎯 개요

**Hybrid 방식**: Docker Compose처럼 이미지만 가져와서 배포
- ⚡ 빌드는 GitHub 클라우드에서 (빠른 고성능 서버)
- 💾 배포는 K3s 서버에서 (이미지만 pull)
- 🔒 내부망 지원 (172.30.1.X)

---

## ⚡ 3분 설정

### 1️⃣ K3s 서버에 Runner 설치

```bash
# K3s 서버 접속
ssh your-user@172.30.1.XXX

# Runner 다운로드
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.313.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-linux-x64-2.313.0.tar.gz

# 압축 해제
tar xzf ./actions-runner-linux-x64-*.tar.gz
```

### 2️⃣ GitHub에서 Runner 등록

**브라우저에서:**
1. GitHub 저장소 → **Settings** → **Actions** → **Runners**
2. **New self-hosted runner** 클릭
3. OS: **Linux** 선택
4. 화면에 나온 **토큰(token)** 복사

**K3s 서버에서:**
```bash
# Runner 설정 (위에서 복사한 토큰 사용)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN

# 프롬프트에서 모두 Enter (기본값 사용)

# 서비스로 등록 및 시작
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

### 3️⃣ GitHub Secret 설정

**GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret**

**1개만 추가:**

| Name<br/>(그대로 복사) | Secret<br/>(본인 값으로 변경) |
| -------------- | ------------------------------------ |
| `DB_PASSWORD`  | `csrpass` ← 본인의 DB 비밀번호 |

### 4️⃣ 코드 푸시

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

### 5️⃣ 배포 확인

**브라우저에서:**
1. GitHub 저장소 → **Actions** 탭
2. 워크플로우 확인:
   - `build` (GitHub 클라우드) ✅ - Maven, Docker 빌드
   - `deploy` (K3s 서버) ✅ - kubectl 배포

**K3s 서버에서:**

```bash
# Pod 확인
kubectl get pods

# 이미지 확인 (GHCR에서 pull됨)
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[0].image}'
# ghcr.io/your-username/your-repo/backend:latest

# 로그 확인
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend
```

**이제 Docker Compose처럼 작동합니다!** 🎉
- 빌드는 GitHub 클라우드 ⚡
- 이미지만 pull해서 배포 💾
- 서버는 가볍게! 🚀

---

## 🔄 일상적인 사용

```bash
# 평소 작업
git add .
git commit -m "Update feature"
git push origin main

# GitHub Actions 자동 실행:
# [클라우드] Maven 빌드 (2분)
# [클라우드] Docker 이미지 빌드 (1분)
# [클라우드] GHCR 푸시 (30초)
# [K3s 서버] kubectl 배포 (30초)
# [K3s 서버] 이미지 pull (30초)
# 완료! (약 4-5분)
```

---

## 📋 사전 준비 체크리스트

### 4GB DB 서버 (172.30.1.85)
- [ ] MariaDB/MySQL 설치
- [ ] `blog` 데이터베이스 생성
- [ ] `blog_user` 사용자 생성
- [ ] 외부 접근 허용 (`bind-address = 0.0.0.0`)
- [ ] 방화벽 3306 포트 허용

```bash
# 4GB 서버에서 실행
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb

sudo mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'csr'@'%' IDENTIFIED BY 'csrpass';
GRANT ALL PRIVILEGES ON blog.* TO 'csr'@'%';
FLUSH PRIVILEGES;
EOF

sudo ufw allow from 172.30.1.0/24 to any port 3306
```

### 8GB K3s 서버
- [ ] k3s 설치
- [ ] kubectl 사용 가능
- [ ] Self-hosted runner 설치
- [ ] Runner 온라인 상태 확인

### GitHub
- [ ] 저장소 생성
- [ ] Actions 활성화
- [ ] `DB_PASSWORD` Secret 추가

---

## 📊 워크플로우 흐름

```
Developer PC          GitHub Cloud              K3s Server
    │                      │                         │
    ├─ git push ─────────▶ │                         │
    │                      │                         │
    │                      ├─ Maven 빌드             │
    │                      ├─ Docker 빌드            │
    │                      ├─ GHCR 푸시 ──────────┐  │
    │                      │                      │  │
    │                      │                      ▼  │
    │                      │                     GHCR │
    │                      │                      │  │
    │                 (빌드 완료)                 │  │
    │                      │                      │  │
    │                      ├─ Self-hosted Runner ─┼──▶
    │                      │   (K3s 서버 실행)   │  │
    │                      │                      │  │
    │                      │                      │  ├─ kubectl apply
    │                      │                      │  ├─ 이미지 pull ◀──┘
    │                      │                      │  ├─ Pod 생성
    │                      │                      │  └─ 완료! ✅
```

---

## ✅ 장점

### Docker Compose와 동일한 경험
- ⚡ 빌드 빠름 (GitHub 고성능 서버)
- 💾 서버 가벼움 (빌드 도구 불필요)
- 🎯 이미지만 pull해서 사용
- 🔑 Git 키로 GHCR 접근

### 추가 장점
- 🔒 내부망 지원
- 🚀 자동 배포
- 📝 GitHub Secret 1개만
- 🔄 자동 롤아웃

---

## 🛠️ 트러블슈팅

### 문제: Runner가 오프라인

```bash
# K3s 서버에서
sudo ~/actions-runner/svc.sh status
sudo ~/actions-runner/svc.sh restart
```

### 문제: ImagePullBackOff

```bash
# GHCR Secret 확인
kubectl get secret ghcr-secret
kubectl describe secret ghcr-secret

# Secret 재생성 (자동으로 생성되지만)
kubectl delete secret ghcr-secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

### 문제: DB 연결 실패

```bash
# K3s 서버에서 DB 연결 테스트
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h 172.30.1.85 -u blog_user -p -e "SHOW DATABASES;"

# ConfigMap 확인
kubectl get configmap blog-db-config -o yaml

# Secret 확인
kubectl get secret blog-db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### 문제: 빌드는 성공, 배포 실패

```bash
# Runner 로그 확인
sudo journalctl -u actions.runner.* -f

# kubectl 권한 확인
kubectl get nodes
```

---

## 📚 자주 사용하는 명령어

### 배포 상태 확인

```bash
# Pod 목록
kubectl get pods

# 실시간 로그
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend

# 리소스 사용량
kubectl top nodes
kubectl top pods
```

### 수동 재배포

```bash
# 강제 재배포 (이미지 업데이트 시)
kubectl rollout restart deployment/blog-backend
kubectl rollout restart deployment/blog-frontend

# 롤아웃 상태 확인
kubectl rollout status deployment/blog-backend
```

### Runner 관리

```bash
# K3s 서버에서
sudo ~/actions-runner/svc.sh status   # 상태 확인
sudo ~/actions-runner/svc.sh stop     # 중지
sudo ~/actions-runner/svc.sh start    # 시작
sudo ~/actions-runner/svc.sh restart  # 재시작
```

---

## 🎉 완료!

이제 Docker Compose처럼 간단하게 배포됩니다!

```bash
git push origin main
# ↓
# GitHub 클라우드에서 빌드 (빠름)
# ↓
# K3s 서버에서 이미지 pull & 배포
# ↓
# 완료! 🚀
```

---

## 📖 추가 문서

- [Hybrid 방식 상세 설명](k8s/HYBRID-APPROACH.md)
- [배포 가이드](k8s/DEPLOY-GUIDE.md)
- [빠른 참조](k8s/QUICK-REFERENCE.md)
- [K3s 가이드](k8s/README-k3s.md)

---

**마지막 업데이트**: 2026-01-31  
**방식**: Hybrid (클라우드 빌드 + 로컬 배포)  
**DB 서버**: 172.30.1.85 (4GB)  
**K3s 서버**: 8GB, Self-hosted Runner
