# CI/CD 빠른 시작 가이드

## 🎯 목표
GitHub에 코드를 푸시하면 자동으로 K3s 서버에 배포

---

## ⚡ 5분 설정

### 1️⃣ K3s 서버 준비 (8GB 서버)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# 개인키 복사 (GitHub Secrets에 사용)
cat ~/.ssh/github-actions
# 전체 내용 복사 (Ctrl+Shift+C)
```

### 2️⃣ GitHub Secrets 설정

**GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret**

| Name           | Value                                |
| -------------- | ------------------------------------ |
| `K3S_HOST`     | `172.30.1.XXX` (8GB 서버 IP)          |
| `K3S_USER`     | `your-username` (SSH 사용자명)         |
| `K3S_SSH_KEY`  | `-----BEGIN...-----END` (위에서 복사한 키) |
| `DB_PASSWORD`  | `your-db-password` (4GB 서버 DB 비밀번호) |

### 3️⃣ 코드 푸시

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

### 4️⃣ 배포 확인

**GitHub → Actions 탭 → 워크플로우 확인**

성공하면 ✅ 표시

---

## 📋 전체 체크리스트

### 사전 준비

#### 4GB DB 서버 (172.30.1.85)
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
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
EOF

sudo ufw allow from 172.30.1.0/24 to any port 3306
```

#### 8GB K3s 서버
- [ ] K3s 설치
- [ ] kubectl 사용 가능
- [ ] SSH 서버 실행 중
- [ ] GitHub Actions용 SSH 키 생성

```bash
# 8GB 서버에서 실행
# K3s 설치 (미설치 시)
curl -sfL https://get.k3s.io | sh -

# SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 개인키 확인 (GitHub Secrets에 추가)
cat ~/.ssh/github-actions
```

### GitHub 설정

#### Secrets 추가
- [ ] `K3S_HOST` - K3s 서버 IP
- [ ] `K3S_USER` - SSH 사용자명
- [ ] `K3S_SSH_KEY` - SSH 개인키
- [ ] `DB_PASSWORD` - DB 비밀번호

#### 저장소 권한
- [ ] Actions 활성화 (Settings → Actions → General → Allow all actions)
- [ ] Packages 쓰기 권한 (자동으로 설정됨)

### 배포

- [ ] 코드를 main 브랜치에 푸시
- [ ] GitHub Actions 워크플로우 실행 확인
- [ ] Pod Running 상태 확인
- [ ] 애플리케이션 접근 테스트

```bash
# 8GB 서버에서 확인
kubectl get pods
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend
```

---

## 🚀 첫 배포 단계별 가이드

### Step 1: DB 서버 설정 (172.30.1.85)

```bash
# 1. DB 생성
sudo mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'MySecure123!';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='blog_user';
EOF

# 2. 외부 접근 허용
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb

# 3. 방화벽 설정
sudo ufw allow from 172.30.1.0/24 to any port 3306
sudo ufw status

# 4. 확인
sudo netstat -tlnp | grep 3306
# 0.0.0.0:3306 확인
```

### Step 2: K3s 서버 설정 (8GB 서버)

```bash
# 1. DB 연결 테스트
mysql -h 172.30.1.85 -u blog_user -p -e "SHOW DATABASES;"
# blog 데이터베이스가 보이면 성공!

# 2. SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
# 비밀번호 없이 생성 (Enter 2번)

cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 3. 개인키 내용 확인 및 복사
cat ~/.ssh/github-actions
# 전체 내용 복사:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# 4. 서버 IP 확인
hostname -I | awk '{print $1}'
# 예: 172.30.1.101
```

### Step 3: GitHub Secrets 설정

1. GitHub 저장소 페이지 접속
2. **Settings** 클릭
3. 왼쪽 메뉴: **Secrets and variables** → **Actions**
4. **New repository secret** 버튼 클릭
5. 다음 4개 추가:

**K3S_HOST**
```
172.30.1.101
```

**K3S_USER**
```
your-username
```

**K3S_SSH_KEY**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
...
-----END OPENSSH PRIVATE KEY-----
```

**DB_PASSWORD**
```
MySecure123!
```

### Step 4: 코드 푸시 및 배포

```bash
# Windows 개발 PC에서
cd C:\Users\moonj\Desktop\blog

# Git 상태 확인
git status

# 변경사항 커밋
git add .
git commit -m "Setup GitHub Actions CI/CD"

# GitHub에 푸시
git push origin main
```

### Step 5: 배포 확인

**브라우저에서:**
1. GitHub 저장소 → **Actions** 탭
2. 최근 워크플로우 실행 확인
3. `build-backend`, `build-frontend`, `deploy` 단계 모두 ✅

**8GB 서버에서:**

```bash
# Pod 상태 확인
kubectl get pods
# NAME                            READY   STATUS    RESTARTS   AGE
# blog-backend-xxx                1/1     Running   0          2m
# blog-frontend-xxx               1/1     Running   0          2m

# 백엔드 로그 확인
kubectl logs -f deployment/blog-backend
# "HikariPool-1 - Start completed" 확인

# 프론트엔드 로그 확인
kubectl logs -f deployment/blog-frontend
# "Ready" 또는 "Listening on port 3000" 확인

# 서비스 확인
kubectl get svc
# blog-backend    ClusterIP   10.43.xxx.xxx   <none>   8080/TCP
# blog-frontend   ClusterIP   10.43.xxx.xxx   <none>   3000/TCP
```

---

## 🔄 일상적인 사용

### 코드 변경 후 배포

```bash
# 1. 코드 수정
# 2. 테스트
# 3. 커밋 및 푸시
git add .
git commit -m "Add new feature"
git push origin main

# 4. GitHub Actions가 자동으로 배포
# 5. 확인
kubectl get pods -w
```

### 수동 배포 트리거

GitHub → Actions → CI/CD → Run workflow → Run workflow

---

## 🛠️ 자주 사용하는 명령어

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

# 배포 이미지 확인
kubectl get deployment blog-backend -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### 문제 해결

```bash
# Pod 상세 정보
kubectl describe pod <pod-name>

# 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# Secret 확인
kubectl get secret blog-db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# ConfigMap 확인
kubectl get configmap blog-db-config -o yaml

# Pod 재시작
kubectl rollout restart deployment/blog-backend
kubectl rollout restart deployment/blog-frontend
```

---

## ❌ 문제 해결

### "Permission denied (publickey)"

```bash
# K3s 서버에서 확인
cat ~/.ssh/authorized_keys | grep github-actions

# 없으면 다시 추가
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# GitHub Secret K3S_SSH_KEY 확인
# 전체 내용이 포함되어야 함 (BEGIN부터 END까지)
```

### "ImagePullBackOff"

```bash
# GHCR Secret 재생성 (K3s 서버)
kubectl delete secret ghcr-secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN

# GitHub 패키지 권한 확인
# GitHub → Packages → blog/backend → Settings → Manage Actions access
```

### "DB Connection Failed"

```bash
# K3s 서버에서 DB 연결 테스트
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h 172.30.1.85 -u blog_user -p -e "SHOW DATABASES;"

# 실패 시 4GB 서버에서 확인
sudo ufw status | grep 3306
sudo netstat -tlnp | grep 3306
```

---

## 📚 추가 문서

- **상세 가이드**: `k8s/GITHUB-ACTIONS-SETUP.md`
- **배포 가이드**: `k8s/DEPLOY-GUIDE.md`
- **빠른 참조**: `k8s/QUICK-REFERENCE.md`

---

## ✅ 성공 기준

- [ ] GitHub Actions 워크플로우가 녹색(✅)으로 완료
- [ ] `kubectl get pods` 명령어로 Pod가 모두 Running
- [ ] 백엔드 로그에서 "HikariPool-1 - Start completed" 확인
- [ ] 프론트엔드 로그에서 "Ready" 확인
- [ ] 애플리케이션에 접근 가능 (port-forward 또는 Ingress)

---

## 🎉 완료!

이제 코드를 푸시하면 자동으로 배포됩니다!

```bash
git push origin main
# 2-3분 후 자동 배포 완료 🚀
```
