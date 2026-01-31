# k3s 배포 가이드

k3s에 Blog 애플리케이션을 배포하는 가이드입니다.

## k3s 특징

- **경량**: 단일 바이너리 (~100MB)
- **기본 Ingress**: Traefik (NGINX 대신)
- **기본 LoadBalancer**: ServiceLB (MetalLB 설치 불필요)
- **기본 Storage**: local-path-provisioner

## 사전 준비

### 1. k3s 설치 (서버에서)

```bash
# 기본 설치
curl -sfL https://get.k3s.io | sh -

# kubeconfig 확인
sudo cat /etc/rancher/k3s/k3s.yaml

# kubectl 사용 (root 권한 필요 또는 권한 조정)
sudo k3s kubectl get nodes
```

### 2. kubeconfig 설정 (로컬 머신)

```bash
# 서버에서 kubeconfig 복사
scp user@server:/etc/rancher/k3s/k3s.yaml ~/.kube/k3s-config

# kubeconfig 수정 (server 주소를 실제 서버 IP로 변경)
# 127.0.0.1:6443 → YOUR_SERVER_IP:6443

# 환경 변수 설정
export KUBECONFIG=~/.kube/k3s-config

# 확인
kubectl get nodes
```

### 3. cert-manager 설치 (HTTPS용)

```bash
# cert-manager 설치
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# 설치 확인
kubectl get pods -n cert-manager
```

## 배포 순서

### 1. 이미지 레지스트리 인증 (필요시)

GitHub Container Registry (GHCR) 사용 시:

```bash
# Secret 생성
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  -n default

# 또는 YAML로 생성
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: ghcr-secret
  namespace: default
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: $(echo -n '{"auths":{"ghcr.io":{"username":"YOUR_USERNAME","password":"YOUR_TOKEN","auth":"'$(echo -n YOUR_USERNAME:YOUR_TOKEN | base64)'"}}}' | base64 -w 0)
EOF
```

그리고 deployment에 추가:

```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: ghcr-secret
```

### 2. 데이터베이스 설정

> **호스트 서버에 DB가 설치된 경우**: [HOST-DB-SETUP.md](./HOST-DB-SETUP.md) 참고

#### 옵션 1: YAML 파일로 설정 (권장)

```bash
# database-config.yaml 파일 수정
vi database-config.yaml

# 호스트 DB 사용 시:
# DB_HOST: "host.k3s.internal"  (k3s 특화)
# 또는
# DB_HOST: "192.168.1.100"      (호스트 IP)

# DB 포트, 이름, 사용자, 비밀번호 수정 후 적용
kubectl apply -f database-config.yaml -n default
```

#### 옵션 2: 커맨드라인으로 설정

```bash
# ConfigMap 생성 (비민감 정보)
kubectl create configmap blog-db-config \
  --from-literal=DB_HOST=your-db-host.example.com \
  --from-literal=DB_PORT=3306 \
  --from-literal=DB_NAME=blog \
  -n default

# Secret 생성 (민감 정보)
kubectl create secret generic blog-db-secret \
  --from-literal=DB_USER=blog_user \
  --from-literal=DB_PASSWORD=your-secure-password \
  -n default
```

#### 옵션 3: .env 파일에서 생성

```bash
# .env 파일 생성
cat > db.env <<EOF
DB_HOST=your-db-host.example.com
DB_PORT=3306
DB_NAME=blog
DB_USER=blog_user
DB_PASSWORD=your-secure-password
EOF

# ConfigMap과 Secret 생성
kubectl create configmap blog-db-config \
  --from-env-file=db.env \
  -n default

kubectl create secret generic blog-db-secret \
  --from-env-file=db.env \
  -n default

# .env 파일 삭제 (보안)
rm db.env
```

#### 데이터베이스 초기화

```bash
# 호스트 서버에서 실행
sudo mysql -u root -p

# MariaDB/MySQL에서 실행
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;

# 또는 제공된 스크립트 사용
sudo mysql -u root -p < db-init.sql
```

#### 호스트 DB 설정 (중요!)

호스트 서버의 MariaDB를 k3s pod에서 접근하려면:

```bash
# 1. MariaDB 외부 접근 허용
sudo vi /etc/mysql/mariadb.conf.d/50-server.cnf
# bind-address = 0.0.0.0 으로 변경

sudo systemctl restart mariadb

# 2. 방화벽 설정 (k3s pod network만 허용)
sudo ufw allow from 10.42.0.0/16 to any port 3306

# 3. 연결 테스트
# Pod에서 테스트
kubectl run -it --rm debug --image=mariadb:10 --restart=Never -- \
  mysql -h host.k3s.internal -u blog_user -p blog
```

자세한 내용은 [HOST-DB-SETUP.md](./HOST-DB-SETUP.md)를 참고하세요.

### 3. 매니페스트 수정

#### `backend-deployment.yaml`
- 이미지 경로: `ghcr.io/YOUR_USERNAME/YOUR_REPO/backend:latest`
- 환경 변수 추가 (필요시)

#### `frontend-deployment.yaml`
- 이미지 경로: `ghcr.io/YOUR_USERNAME/YOUR_REPO/frontend:latest`
- `NEXT_PUBLIC_API_URL`: 실제 도메인으로 수정

#### `cert-manager.yaml`
- 이메일 주소 수정

#### `ingress-traefik.yaml`
- 도메인 이름 수정

### 4. 배포 실행

```bash
# 백엔드 배포
kubectl apply -f backend-deployment.yaml

# 프론트엔드 배포
kubectl apply -f frontend-deployment.yaml

# cert-manager ClusterIssuer 생성
kubectl apply -f cert-manager.yaml

# Ingress 생성 (Traefik용)
kubectl apply -f ingress-traefik.yaml

# 배포 확인
kubectl get all
kubectl get ingress
kubectl get certificate
```

### 5. DNS 설정

도메인의 A 레코드를 k3s 서버 IP로 설정:

```
yourdomain.com → YOUR_SERVER_IP
```

### 6. 배포 확인

```bash
# Pod 상태
kubectl get pods
kubectl describe pod <pod-name>

# Service 확인
kubectl get svc

# Ingress 확인
kubectl get ingress

# 인증서 확인
kubectl get certificate

# 로그 확인
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend
```

## k3s 특화 명령어

```bash
# k3s 버전 확인
sudo k3s --version

# k3s 중지
sudo systemctl stop k3s

# k3s 시작
sudo systemctl start k3s

# k3s 재시작
sudo systemctl restart k3s

# k3s 상태
sudo systemctl status k3s

# k3s 제거
/usr/local/bin/k3s-uninstall.sh
```

## 스케일링

```bash
# 백엔드 스케일
kubectl scale deployment blog-backend --replicas=3

# 프론트엔드 스케일
kubectl scale deployment blog-frontend --replicas=3

# 자동 스케일링 (HPA)
kubectl autoscale deployment blog-backend --cpu-percent=50 --min=2 --max=5
```

## 업데이트

```bash
# 이미지 업데이트 (CI/CD에서 자동으로 push된 경우)
kubectl rollout restart deployment/blog-backend
kubectl rollout restart deployment/blog-frontend

# 롤아웃 상태 확인
kubectl rollout status deployment/blog-backend

# 롤백
kubectl rollout undo deployment/blog-backend
```

## 모니터링

```bash
# 리소스 사용량
kubectl top nodes
kubectl top pods

# 이벤트 확인
kubectl get events --sort-by='.lastTimestamp'

# 로그 스트리밍
kubectl logs -f deployment/blog-backend
kubectl logs -f deployment/blog-frontend
```

## 트러블슈팅

### Pod가 Pending 상태

```bash
kubectl describe pod <pod-name>
# 리소스 부족 또는 imagePullSecret 문제 확인
```

### Ingress가 작동하지 않음

```bash
# Traefik 상태 확인
kubectl get pods -n kube-system | grep traefik

# Ingress 상세 정보
kubectl describe ingress blog-ingress
```

### 인증서가 발급되지 않음

```bash
# cert-manager 로그 확인
kubectl logs -n cert-manager deployment/cert-manager

# Certificate 상태 확인
kubectl describe certificate blog-tls

# CertificateRequest 확인
kubectl get certificaterequest
kubectl describe certificaterequest <name>
```

### 이미지를 가져올 수 없음

```bash
# imagePullSecret 확인
kubectl get secret ghcr-secret
kubectl describe secret ghcr-secret

# Pod 이벤트 확인
kubectl describe pod <pod-name>
```

## 백업 및 복원

```bash
# k3s 백업
sudo cp -r /var/lib/rancher/k3s /backup/k3s-$(date +%Y%m%d)

# etcd 백업 (HA 구성인 경우)
sudo k3s etcd-snapshot save

# 복원
sudo k3s etcd-snapshot restore <snapshot-file>
```

## 보안 권장 사항

1. **네트워크 정책 적용**
2. **RBAC 설정**
3. **Secret 암호화**
4. **정기적인 업데이트**
5. **방화벽 설정** (6443, 80, 443 포트만 개방)

## 성능 튜닝

```bash
# k3s 설치 시 옵션
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
# Traefik 대신 NGINX Ingress 사용하려면

# 리소스 제한 조정 (deployment.yaml에서)
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

## 참고 자료

- [k3s 공식 문서](https://docs.k3s.io/)
- [Traefik 문서](https://doc.traefik.io/traefik/)
- [cert-manager 문서](https://cert-manager.io/docs/)
