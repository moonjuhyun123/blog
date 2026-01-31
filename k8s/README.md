# Kubernetes Deployment Guide

이 프로젝트는 Spring Boot 백엔드와 Next.js 프론트엔드를 별도의 Pod로 배포합니다.

## 배포 환경 선택

- **k3s 사용자**: [README-k3s.md](./README-k3s.md) 참고 (추천)
- **일반 Kubernetes**: 아래 가이드 참고

## 사전 준비

1. Kubernetes 클러스터 (또는 k3s)
2. kubectl 설치
3. Ingress Controller 설치
   - k3s: Traefik (기본 설치됨)
   - 일반 k8s: NGINX Ingress Controller
4. (선택) cert-manager 설치 (HTTPS용)

## 배포 순서

### 1. 이미지 레지스트리 설정

GitHub Container Registry를 사용합니다. `.github/workflows/ci.yml`에서 이미지 이름을 확인하세요.

### 2. Kubernetes 매니페스트 수정

각 파일에서 다음 값을 수정하세요:

- `backend-deployment.yaml`: 이미지 경로 수정
- `frontend-deployment.yaml`: 이미지 경로 및 `NEXT_PUBLIC_API_URL` 수정
- `ingress.yaml`: 도메인 이름 수정

### 3. 배포 실행

```bash
# 네임스페이스 생성 (선택)
kubectl create namespace blog

# 백엔드 배포
kubectl apply -f k8s/backend-deployment.yaml -n blog

# 프론트엔드 배포
kubectl apply -f k8s/frontend-deployment.yaml -n blog

# Ingress 설정
# k3s (Traefik) 사용자:
kubectl apply -f k8s/ingress-traefik.yaml -n blog

# 일반 Kubernetes (NGINX) 사용자:
kubectl apply -f k8s/ingress.yaml -n blog
```

### 4. 배포 확인

```bash
# Pod 상태 확인
kubectl get pods -n blog

# Service 확인
kubectl get svc -n blog

# Ingress 확인
kubectl get ingress -n blog
```

## 환경 변수 설정

### Backend (Spring Boot)

ConfigMap이나 Secret으로 환경 변수를 관리할 수 있습니다:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  SPRING_PROFILES_ACTIVE: "prod"
  # 추가 환경 변수
```

### Frontend (Next.js)

빌드 타임 환경 변수는 Dockerfile에서, 런타임 환경 변수는 deployment에서 설정합니다.

## 스케일링

```bash
# 백엔드 스케일
kubectl scale deployment blog-backend --replicas=3 -n blog

# 프론트엔드 스케일
kubectl scale deployment blog-frontend --replicas=3 -n blog
```

## 롤백

```bash
# 배포 히스토리 확인
kubectl rollout history deployment/blog-backend -n blog

# 이전 버전으로 롤백
kubectl rollout undo deployment/blog-backend -n blog
```

## 로그 확인

```bash
# 백엔드 로그
kubectl logs -f deployment/blog-backend -n blog

# 프론트엔드 로그
kubectl logs -f deployment/blog-frontend -n blog
```

## 트러블슈팅

### Pod가 시작되지 않는 경우

```bash
kubectl describe pod <pod-name> -n blog
kubectl logs <pod-name> -n blog
```

### 이미지를 가져올 수 없는 경우

GitHub Container Registry에 대한 인증이 필요할 수 있습니다:

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<USERNAME> \
  --docker-password=<GITHUB_TOKEN> \
  -n blog
```

그리고 deployment에 `imagePullSecrets`를 추가하세요.
