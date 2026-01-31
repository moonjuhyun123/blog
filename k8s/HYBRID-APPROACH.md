# CI/CD 배포 방식 (Hybrid)

Docker Compose처럼 **이미지만 가져와서 배포**하는 방식입니다.

> **현재 프로젝트는 이 방식을 사용합니다.**

## 🎯 개념

```
GitHub Actions (클라우드)          Self-hosted Runner (K3s 서버)
┌────────────────────┐            ┌────────────────────┐
│  Maven 빌드        │            │                    │
│  Docker 빌드       │            │  kubectl 배포만    │
│  GHCR 푸시         │────────────▶│  이미지 pull       │
└────────────────────┘            └────────────────────┘
     빠른 서버                         내 서버
```

## ✅ 장점

Docker Compose 방식과 동일:
- ⚡ 서버에 빌드 도구 불필요 (Maven, Node 등)
- 🚀 빌드는 GitHub 서버에서 (빠름)
- 💾 서버는 이미지만 pull (가벼움)
- 🔑 Git 키만 있으면 됨

## 📋 사전 준비

### 1. Self-hosted Runner 설치 (한 번만)

```bash
# K3s 서버 접속
ssh your-user@172.30.1.XXX

# Runner 다운로드
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.313.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-linux-x64-2.313.0.tar.gz
tar xzf ./actions-runner-linux-x64-*.tar.gz

# GitHub에서 토큰 가져오기
# GitHub 저장소 → Settings → Actions → Runners → New self-hosted runner

# Runner 등록
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

### 2. GitHub Secrets 설정

**GitHub 저장소 → Settings → Secrets → Actions → New repository secret**

1개만 추가:

| Name | Secret |
|------|--------|
| `DB_PASSWORD` | 본인의 DB 비밀번호 |

### 3. 워크플로우 활성화

```bash
cd .github/workflows

# Hybrid 워크플로우 활성화 (빌드는 클라우드, 배포는 로컬)
mv ci-hybrid.yml ci.yml

# 또는 기존 파일 백업
mv ci.yml ci-old.yml
mv ci-hybrid.yml ci.yml
```

## 🚀 워크플로우 구조

### Job 1: Build (GitHub 클라우드에서 실행)

```yaml
build:
  runs-on: ubuntu-latest  # GitHub 서버
  
  steps:
    - Maven 빌드
    - Docker 이미지 빌드
    - GHCR에 푸시
```

### Job 2: Deploy (Self-hosted runner, K3s 서버에서 실행)

```yaml
deploy:
  needs: build
  runs-on: self-hosted  # 내 K3s 서버
  
  steps:
    - GHCR 인증 secret 생성
    - kubectl로 배포
    - 이미지 pull 및 배포
```

## 📝 K3s 서버에 필요한 것

### ✅ 필요한 것
- kubectl (k3s 설치 시 포함)
- GitHub Actions Runner

### ❌ 불필요한 것
- Maven (빌드는 클라우드)
- JDK (빌드는 클라우드)
- Node.js (빌드는 클라우드)
- Docker build (이미지는 GHCR에서 pull)

> **Docker는 필요**: K3s가 containerd를 사용하지만, GHCR 인증에 docker 명령어 사용 (또는 crictl)

## 🔄 배포 흐름

```
1. git push origin main
   ↓
2. GitHub Actions (클라우드)에서 빌드
   - Maven 빌드 (GitHub 서버)
   - Docker 이미지 빌드 (GitHub 서버)
   - GHCR에 푸시
   ↓
3. Self-hosted Runner (K3s 서버)에서 배포
   - GHCR 인증 설정
   - kubectl apply (deployment)
   - K3s가 자동으로 GHCR에서 이미지 pull
   - Pod 생성
   ↓
4. 완료!
```

## 🆚 3가지 방식 비교

| 항목 | Self-hosted<br/>전체 | Hybrid<br/>(추천) | GitHub-hosted<br/>(SSH) |
|------|-------------------|------------------|----------------------|
| 빌드 위치 | K3s 서버 | GitHub 클라우드 | GitHub 클라우드 |
| 배포 위치 | K3s 서버 | K3s 서버 | SSH로 원격 |
| 서버 부하 | 높음 | 낮음 | 낮음 |
| 빌드 속도 | 중간 | 빠름 | 빠름 |
| Runner 필요 | ✅ | ✅ | ❌ |
| SSH 필요 | ❌ | ❌ | ✅ |
| 서버에 빌드 도구 | 필요 | 불필요 | 불필요 |
| 이미지 저장 | 로컬 | GHCR | GHCR |
| 내부망 OK | ✅ | ✅ | ❌ |
| Docker Compose 유사 | ❌ | ✅ | ✅ |

## 🎯 사용 시나리오

### Hybrid 방식이 좋은 경우 (Docker Compose 스타일)
- ✅ K3s 서버 리소스가 부족 (4GB, 8GB)
- ✅ 빌드 도구를 서버에 설치하기 싫음
- ✅ Docker Compose처럼 이미지만 가져오고 싶음
- ✅ 내부망 환경

### Self-hosted 전체 방식이 좋은 경우
- ✅ K3s 서버 리소스가 충분 (16GB+)
- ✅ 완전히 로컬에서 빌드하고 싶음
- ✅ GHCR 푸시/풀 비용 아끼고 싶음

## 📝 워크플로우 파일

프로젝트에 3개의 워크플로우가 있습니다:

| 파일 | 방식 | 사용 시나리오 |
|------|------|-------------|
| `ci-hybrid.yml` | Hybrid ⭐ | 내부망 + 이미지 방식 (추천) |
| `ci-self-hosted.yml` | Self-hosted | 완전 로컬 빌드 |
| `ci.yml` | GitHub-hosted | 외부 SSH 접근 |

## 🚀 배포 예시

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

## 🔍 배포 확인

### GitHub에서
```
GitHub → Actions 탭
├── build (초록색 ✅)
└── deploy (초록색 ✅)
```

### K3s 서버에서
```bash
# Pod 확인
kubectl get pods
# NAME                            READY   STATUS    RESTARTS   AGE
# blog-backend-xxx                1/1     Running   0          2m
# blog-frontend-xxx               1/1     Running   0          2m

# 이미지 확인 (GHCR에서 pull됨)
kubectl get pod blog-backend-xxx -o jsonpath='{.spec.containers[0].image}'
# ghcr.io/your-username/your-repo/backend:latest

# 로그 확인
kubectl logs -f deployment/blog-backend
```

## 🛠️ 트러블슈팅

### 문제: ImagePullBackOff

```bash
# GHCR Secret 확인
kubectl get secret ghcr-secret
kubectl describe secret ghcr-secret

# Secret 재생성 (GitHub Actions가 자동으로 생성하지만)
kubectl delete secret ghcr-secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

### 문제: Build는 성공했는데 Deploy 실패

```bash
# Runner 상태 확인
sudo ~/actions-runner/svc.sh status

# Runner 로그 확인
journalctl -u actions.runner.* -f

# kubectl 권한 확인
kubectl get nodes
```

### 문제: 이미지가 업데이트 안 됨

```bash
# imagePullPolicy 확인
kubectl get deployment blog-backend -o jsonpath='{.spec.template.spec.containers[0].imagePullPolicy}'
# Always 여야 함

# 강제 재배포
kubectl rollout restart deployment/blog-backend
kubectl rollout restart deployment/blog-frontend
```

## ✅ 체크리스트

배포 전:
- [ ] Self-hosted runner 설치
- [ ] Runner 온라인 상태 (GitHub Settings → Actions → Runners)
- [ ] `DB_PASSWORD` Secret 추가
- [ ] `ci-hybrid.yml` 활성화
- [ ] `backend-deployment.yaml`, `frontend-deployment.yaml`에 `imagePullSecrets` 설정

배포 후:
- [ ] GitHub Actions 빌드 성공 (초록색)
- [ ] GitHub Actions 배포 성공 (초록색)
- [ ] Pod Running 상태
- [ ] 이미지가 GHCR에서 pull됨
- [ ] 애플리케이션 정상 작동

## 🎉 완료!

이제 Docker Compose처럼 이미지만 가져와서 배포됩니다!

```bash
git push origin main
# ↓
# GitHub 서버에서 빌드 (빠름)
# ↓
# K3s 서버에서 이미지 pull & 배포
# ↓
# 완료! 🚀
```

**서버는 가볍게, 빌드는 빠르게!** ⚡
