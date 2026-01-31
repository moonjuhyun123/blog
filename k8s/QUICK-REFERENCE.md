# K3s 배포 빠른 참조 카드

## 🚀 빠른 시작 (한 줄 요약)

### 8GB K3s 서버에서 실행:

```bash
# 1. 프로젝트 가져오기
git clone <repo-url> ~/blog && cd ~/blog

# 2. DB 설정 수정 (4GB 서버 IP와 비밀번호)
nano k8s/database-config.yaml

# 3. 빌드 및 배포
cd k8s && chmod +x quick-deploy.sh && ./quick-deploy.sh

# 4. 로그 확인
kubectl logs -f deployment/blog-backend
```

---

## 📌 자주 쓰는 명령어

### Pod 관리

```bash
# Pod 목록 보기
kubectl get pods

# Pod 상태 실시간 모니터링
kubectl get pods -w

# Pod 상세 정보
kubectl describe pod <pod-name>

# Pod 로그 보기 (실시간)
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend

# Pod 재시작
kubectl rollout restart deployment/blog-backend
kubectl rollout restart deployment/blog-frontend

# Pod 삭제 (자동으로 재생성됨)
kubectl delete pod <pod-name>
```

### 이미지 업데이트

```bash
# 백엔드 재빌드 및 배포
cd ~/blog/backend
mvn clean package -DskipTests
cd ~/blog
docker build -f Dockerfile.backend -t blog-backend:latest .
kubectl rollout restart deployment/blog-backend

# 프론트엔드 재빌드 및 배포
cd ~/blog
docker build -f Dockerfile.frontend -t blog-frontend:latest .
kubectl rollout restart deployment/blog-frontend
```

### 리소스 확인

```bash
# 전체 리소스 보기
kubectl get all

# 서비스 확인
kubectl get svc

# Ingress 확인
kubectl get ingress

# ConfigMap 확인
kubectl get configmap

# Secret 확인
kubectl get secret
```

### 스케일링

```bash
# 백엔드 Pod 수 조정
kubectl scale deployment blog-backend --replicas=2

# 프론트엔드 Pod 수 조정
kubectl scale deployment blog-frontend --replicas=1

# 0으로 설정하여 중지 (메모리 확보)
kubectl scale deployment blog-frontend --replicas=0
```

### 포트 포워딩 (로컬 테스트)

```bash
# 백엔드 API 테스트
kubectl port-forward svc/blog-backend 8080:8080
# 다른 터미널에서: curl http://localhost:8080/actuator/health

# 프론트엔드 테스트
kubectl port-forward svc/blog-frontend 3000:3000
# 브라우저: http://localhost:3000
```

### 리소스 모니터링

```bash
# 노드 리소스 사용량
kubectl top nodes

# Pod 리소스 사용량
kubectl top pods

# 특정 Pod의 리소스
kubectl top pod <pod-name>

# 실시간 모니터링
watch kubectl top pods
```

---

## 🔧 트러블슈팅

### Pod가 시작 안 됨 (CrashLoopBackOff, Error, ImagePullBackOff)

```bash
# 1. Pod 상세 정보 확인
kubectl describe pod <pod-name>

# 2. 로그 확인
kubectl logs <pod-name>

# 3. 이전 로그 확인 (재시작된 경우)
kubectl logs <pod-name> --previous

# 4. 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# 5. 이미지 확인
docker images | grep blog
```

### DB 연결 실패

```bash
# 1. ConfigMap 확인
kubectl get configmap blog-db-config -o yaml

# 2. Secret 확인
kubectl get secret blog-db-secret -o yaml

# 3. Pod에서 DB 연결 테스트
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h <DB_HOST> -u blog_user -p<DB_PASSWORD> -e "SHOW DATABASES;"

# 4. 백엔드 Pod에서 환경변수 확인
kubectl exec -it <backend-pod-name> -- env | grep DB_
```

### 메모리 부족

```bash
# 1. 노드 리소스 확인
kubectl describe node

# 2. Pod 리소스 확인
kubectl top pods

# 3. 불필요한 Pod 중지
kubectl scale deployment blog-frontend --replicas=0

# 4. 리소스 제한 조정 (backend-deployment.yaml 수정)
kubectl edit deployment blog-backend
```

### 네트워크 문제

```bash
# 1. Service 확인
kubectl get svc

# 2. Endpoints 확인 (Pod가 Service에 연결되었는지)
kubectl get endpoints

# 3. Pod IP 확인
kubectl get pods -o wide

# 4. Pod 간 연결 테스트
kubectl exec -it <frontend-pod> -- curl http://blog-backend:8080/actuator/health
```

---

## 🗑️ 삭제 및 정리

### 애플리케이션 삭제

```bash
cd ~/blog/k8s

# 개별 삭제
kubectl delete -f backend-deployment.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f database-config.yaml

# 모든 리소스 한 번에 삭제 (namespace 사용 시)
kubectl delete namespace <namespace>
```

### Docker 이미지 정리

```bash
# 사용하지 않는 이미지 삭제
docker image prune -a

# 특정 이미지 삭제
docker rmi blog-backend:latest
docker rmi blog-frontend:latest
```

---

## 📁 주요 파일 위치

```
blog/
├── k8s/
│   ├── DEPLOY-GUIDE.md          # 상세 배포 가이드
│   ├── QUICK-REFERENCE.md       # 이 파일
│   ├── quick-deploy.sh          # 자동 배포 스크립트
│   ├── database-config.yaml     # DB 연결 설정 ⚠️ 수정 필요
│   ├── backend-deployment.yaml  # 백엔드 배포 설정
│   ├── frontend-deployment.yaml # 프론트엔드 배포 설정
│   └── ingress-traefik.yaml     # Ingress 설정 (선택)
├── Dockerfile.backend           # 백엔드 Docker 이미지
├── Dockerfile.frontend          # 프론트엔드 Docker 이미지
├── backend/                     # Spring Boot 백엔드
└── next-seo/                    # Next.js 프론트엔드
```

---

## 🔑 환경 변수

### 백엔드 (Spring Boot)

| 변수                      | 설명          | 예시                 |
| ----------------------- | ----------- | ------------------ |
| `SPRING_PROFILES_ACTIVE` | Spring 프로필  | `prod`             |
| `DB_HOST`               | DB 호스트      | `192.168.1.100`    |
| `DB_PORT`               | DB 포트       | `3306`             |
| `DB_NAME`               | DB 이름       | `blog`             |
| `DB_USER`               | DB 사용자      | `blog_user`        |
| `DB_PASSWORD`           | DB 비밀번호     | `MySecurePass123!` |

### 프론트엔드 (Next.js)

| 변수                     | 설명                         | K8s 예시 |
| ---------------------- | -------------------------- | -------- |
| `NODE_ENV`             | Node 환경                   | `production` |
| `NEXT_PUBLIC_API_URL`  | 브라우저용 API 주소. **같은 도메인**이면 빈 값(상대 경로 `/api` 사용) | `""` |
| `API_BASE_URL`         | 서버(SSR/사이트맵)용 API 주소. **클러스터 내부** 주소 | `http://blog-backend:8080` |
| `SITE_URL`             | 공개 URL (사이트맵, canonical) | `https://yourdomain.com` |

---

## 💡 유용한 팁

### 1. 로그 실시간 모니터링

```bash
# 여러 Pod의 로그를 동시에 보기
kubectl logs -f -l app=blog-backend
kubectl logs -f -l app=blog-frontend
```

### 2. Pod 내부 접속

```bash
# 백엔드 Pod 내부 쉘
kubectl exec -it <backend-pod-name> -- /bin/sh

# 프론트엔드 Pod 내부 쉘
kubectl exec -it <frontend-pod-name> -- /bin/sh
```

### 3. ConfigMap/Secret 업데이트

```bash
# ConfigMap 수정
kubectl edit configmap blog-db-config

# Secret 수정
kubectl edit secret blog-db-secret

# 수정 후 Pod 재시작 필요
kubectl rollout restart deployment/blog-backend
```

### 4. YAML 파일에서 직접 적용

```bash
# 파일 수정 후 적용
kubectl apply -f database-config.yaml

# 변경사항 확인
kubectl diff -f database-config.yaml
```

### 5. 롤백

```bash
# 배포 히스토리 확인
kubectl rollout history deployment/blog-backend

# 이전 버전으로 롤백
kubectl rollout undo deployment/blog-backend

# 특정 리비전으로 롤백
kubectl rollout undo deployment/blog-backend --to-revision=2
```

---

## 🌐 외부 접근 설정

### NodePort 사용 (간단)

```bash
# Service를 NodePort로 변경
kubectl patch svc blog-frontend -p '{"spec":{"type":"NodePort"}}'

# NodePort 확인
kubectl get svc blog-frontend
# 출력: PORT(S)에서 3000:30XXX/TCP 확인

# 외부에서 접근: http://<8GB-서버-IP>:30XXX
```

### Ingress 사용 (도메인)

```bash
# Ingress 적용
kubectl apply -f ingress-traefik.yaml

# Ingress 확인
kubectl get ingress

# 도메인으로 접근: http://yourdomain.com
```

---

## ⚙️ 쿠버네티스에서 돌아가게 할 설정

서버(K8s)에 올렸을 때 **반드시 수정**할 것:

| 파일 | 수정 내용 |
|------|-----------|
| `frontend-deployment.yaml` | `image`: `ghcr.io/OWNER/REPO/frontend:latest` → 실제 이미지 (예: `ghcr.io/moonjuhyun123/blog/frontend:latest`) |
| `frontend-deployment.yaml` | `SITE_URL`: `https://yourdomain.com` → 실제 도메인 (사이트맵/OGP용) |
| `backend-deployment.yaml` | `image`: `ghcr.io/OWNER/REPO/backend:latest` → 실제 이미지 |
| `database-config.yaml` | `DB_HOST`: 4GB DB 서버 IP, `DB_PASSWORD`: 실제 비밀번호 |
| `ingress.yaml` | `yourdomain.com` → 실제 도메인 (2곳: `tls.hosts`, `rules.host`) |
| **Secret** | `kubectl create secret docker-registry ghcr-secret ...` 로 GHCR 인증 (이미지 pull용) |

**동작 방식 요약**

- 브라우저: `NEXT_PUBLIC_API_URL=""` 이므로 같은 도메인으로 `/api/...` 요청 → Ingress가 `/api`를 백엔드로 전달.
- 프론트 Pod(SSR/사이트맵): `API_BASE_URL=http://blog-backend:8080` 로 클러스터 내부에서 백엔드 호출.

---

## 📞 체크리스트

배포 전 확인:

- [ ] 4GB 서버: MariaDB 설치 및 외부 접근 허용
- [ ] 4GB 서버: blog 데이터베이스 및 사용자 생성
- [ ] 4GB 서버: 방화벽에서 3306 포트 허용
- [ ] 8GB 서버: k3s 설치 및 kubectl 사용 가능
- [ ] 8GB 서버: Docker 설치
- [ ] `database-config.yaml`: DB_HOST를 4GB 서버 IP로 변경
- [ ] `database-config.yaml`: DB_PASSWORD 변경
- [ ] `frontend-deployment.yaml` / `backend-deployment.yaml`: 이미지 주소를 실제 GHCR로 변경
- [ ] `frontend-deployment.yaml`: SITE_URL을 실제 도메인으로 변경
- [ ] `ingress.yaml`: yourdomain.com을 실제 도메인으로 변경
- [ ] GHCR 이미지 pull용 Secret 생성 (`ghcr-secret`)

배포 후 확인:

- [ ] Pod가 모두 Running 상태
- [ ] 백엔드 로그에서 "HikariPool-1 - Start completed" 확인
- [ ] 프론트엔드 로그에서 정상 시작 확인
- [ ] `kubectl top` 명령어로 리소스 사용량 확인
- [ ] 백엔드 API 응답 확인 (port-forward 또는 Ingress)
- [ ] 프론트엔드 웹 페이지 접속 확인

---

## 🆘 도움말

- **상세 가이드**: `DEPLOY-GUIDE.md` 참고
- **K3s 특화 가이드**: `README-k3s.md` 참고
- **호스트 DB 연결**: `QUICKSTART-HOST-DB.md` 참고
- **공식 문서**: [Kubernetes Docs](https://kubernetes.io/docs/), [K3s Docs](https://docs.k3s.io/)

---

**마지막 업데이트**: 2026-01-31
