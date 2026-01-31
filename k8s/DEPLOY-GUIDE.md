# 배포 가이드 - 2서버 구성 (4GB DB + 8GB K3s)

## 환경 구성
- **4GB RAM 서버**: MySQL/MariaDB 전용
- **8GB RAM 서버**: K3s 단일 노드 (마스터 + 워커)

---

## 📋 사전 체크리스트

### 4GB DB 서버
- [ ] MySQL/MariaDB 설치 완료
- [ ] 8GB 서버에서 접근 가능하도록 설정

### 8GB K3s 서버
- [ ] k3s 설치 완료
- [ ] kubectl 명령어 사용 가능
- [ ] Docker 설치 완료 (이미지 빌드용)

---

## 🚀 배포 절차

### 1단계: 4GB 서버 - DB 설정

**4GB 서버에 SSH 접속 후 실행:**

```bash
# 1. MariaDB 외부 접근 허용
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb

# 2. 데이터베이스 및 사용자 생성
sudo mysql -u root -p <<'EOF'
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'MySecurePassword123!';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='blog_user';
EOF

# 3. 4GB 서버의 IP 확인
ip addr show | grep "inet "
# 예: 192.168.1.100

# 4. 방화벽 설정 (8GB 서버 IP만 허용)
# 8GB 서버 IP가 192.168.1.101 이라고 가정
sudo ufw allow from 192.168.1.101 to any port 3306
sudo ufw status

# 5. 연결 확인
sudo netstat -tlnp | grep 3306
# 0.0.0.0:3306 으로 리스닝하는지 확인
```

---

### 2단계: 8GB 서버 - DB 연결 테스트

**8GB 서버에서 실행:**

```bash
# 4GB 서버로 DB 연결 테스트 (4GB 서버 IP: 192.168.1.100 예시)
mysql -h 192.168.1.100 -u blog_user -p -e "SHOW DATABASES;"
# 비밀번호 입력 후 'blog' 데이터베이스가 보이면 성공!
```

---

### 3단계: 8GB 서버 - 프로젝트 파일 전송

**Windows 개발 PC에서 8GB 서버로 프로젝트 전송:**

```bash
# scp 또는 git clone 사용
# 옵션 A: git clone (추천)
ssh user@192.168.1.101
git clone https://github.com/YOUR_USERNAME/blog.git
cd blog

# 옵션 B: scp로 전송
# scp -r C:\Users\moonj\Desktop\blog user@192.168.1.101:~/
```

---

### 4단계: 8GB 서버 - Docker 이미지 빌드

**8GB 서버에서 실행:**

```bash
cd ~/blog

# 백엔드 이미지 빌드
echo "🔨 Building backend image..."
docker build -f Dockerfile.backend -t blog-backend:latest ./backend

# 프론트엔드 이미지 빌드
echo "🔨 Building frontend image..."
docker build -f Dockerfile.frontend -t blog-frontend:latest ./next-seo

# 이미지 확인
docker images | grep blog
```

> **참고**: k3s는 로컬 Docker 이미지를 자동으로 찾아 사용합니다.

---

### 5단계: 8GB 서버 - Kubernetes 설정 수정

**8GB 서버에서 실행:**

```bash
cd ~/blog/k8s

# 1. database-config.yaml 수정
nano database-config.yaml
```

**수정 내용:**

```yaml
# DB_HOST를 4GB 서버의 실제 IP로 변경
DB_HOST: "192.168.1.100"  # ⚠️ 실제 4GB 서버 IP로 변경!

# DB_PASSWORD를 실제 비밀번호로 변경
DB_PASSWORD: "MySecurePassword123!"  # ⚠️ 1단계에서 설정한 비밀번호
```

저장 후 종료 (Ctrl+X, Y, Enter)

---

### 6단계: 8GB 서버 - 배포 실행

**8GB 서버에서 실행:**

```bash
cd ~/blog/k8s

# 1. DB ConfigMap/Secret 적용
kubectl apply -f database-config.yaml

# 2. 배포 실행
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# 3. Pod 상태 확인 (Running이 될 때까지 대기)
kubectl get pods -w
# Ctrl+C로 빠져나오기

# 4. 백엔드 로그 확인 (DB 연결 성공 확인)
kubectl logs -f deployment/blog-backend
# "HikariPool-1 - Start completed" 메시지가 보이면 성공!

# 5. 프론트엔드 로그 확인
kubectl logs -f deployment/blog-frontend
```

---

### 7단계: 8GB 서버 - Ingress 설정 (선택)

외부에서 접근하려면 Ingress 설정:

```bash
cd ~/blog/k8s

# ingress-traefik.yaml 수정 (도메인 변경)
nano ingress-traefik.yaml

# Ingress 적용
kubectl apply -f ingress-traefik.yaml

# Ingress 확인
kubectl get ingress
```

---

## 🔍 확인 및 테스트

### Pod 상태 확인

```bash
# 모든 리소스 확인
kubectl get all

# Pod 상세 정보
kubectl describe pod <pod-name>

# 서비스 확인
kubectl get svc
```

### 로컬 테스트 (8GB 서버 내부)

```bash
# 백엔드 API 테스트
kubectl port-forward svc/blog-backend 8080:8080 &
curl http://localhost:8080/actuator/health

# 프론트엔드 테스트
kubectl port-forward svc/blog-frontend 3000:3000 &
curl http://localhost:3000
```

### 외부 접근 테스트

```bash
# 8GB 서버 IP 확인
ip addr show | grep "inet "

# 다른 PC에서 브라우저로 접속
# http://192.168.1.101:NodePort
```

---

## 🛠️ 트러블슈팅

### 문제 1: Pod가 CrashLoopBackOff

```bash
# 로그 확인
kubectl logs <pod-name>

# 일반적인 원인:
# - DB 연결 실패: database-config.yaml의 DB_HOST, 비밀번호 확인
# - 이미지 없음: docker images 확인
# - 리소스 부족: kubectl describe pod <pod-name>
```

### 문제 2: DB 연결 실패

```bash
# 8GB 서버에서 DB 연결 테스트
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h 192.168.1.100 -u blog_user -pMySecurePassword123! -e "SHOW DATABASES;"

# 실패 시 확인 사항:
# 1. 4GB 서버 방화벽: sudo ufw status
# 2. MySQL bind-address: 0.0.0.0인지 확인
# 3. 사용자 권한: blog_user@'%' 존재하는지 확인
```

### 문제 3: 메모리 부족

```bash
# 리소스 사용량 확인
kubectl top nodes
kubectl top pods

# replicas를 0으로 줄여서 메모리 확보
kubectl scale deployment blog-frontend --replicas=0

# 또는 리소스 제한 조정
# backend-deployment.yaml에서 resources.limits 줄이기
```

---

## 📊 리소스 모니터링

```bash
# 노드 리소스 확인
kubectl top nodes

# Pod 리소스 확인
kubectl top pods

# 지속적인 모니터링
watch kubectl top pods
```

---

## 🔄 업데이트 배포

```bash
# 1. 새 이미지 빌드
docker build -f Dockerfile.backend -t blog-backend:latest ./backend

# 2. Pod 재시작 (새 이미지 사용)
kubectl rollout restart deployment/blog-backend

# 3. 롤아웃 상태 확인
kubectl rollout status deployment/blog-backend
```

---

## 🗑️ 배포 삭제

```bash
cd ~/blog/k8s

# 모든 리소스 삭제
kubectl delete -f backend-deployment.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f database-config.yaml

# 또는 undeploy 스크립트 사용
# ./undeploy.sh
```

---

## 📝 배포 후 체크리스트

- [ ] Pod가 모두 Running 상태
- [ ] 백엔드 로그에서 DB 연결 성공 확인
- [ ] 프론트엔드 로그에서 정상 시작 확인
- [ ] 백엔드 API 응답 확인 (curl 테스트)
- [ ] 프론트엔드 웹 페이지 접속 확인
- [ ] 리소스 사용량 모니터링 (kubectl top)

---

## 💡 권장 사항

### 보안
- DB 비밀번호를 강력하게 설정
- 방화벽에서 필요한 포트만 열기
- 프로덕션 환경에서는 Secret을 base64 인코딩

### 성능
- 8GB 메모리 제약이 있으므로 불필요한 파드 최소화
- 리소스 limits/requests 적절히 조정
- DB 쿼리 최적화 및 인덱스 설정

### 백업
- 4GB 서버의 DB를 정기적으로 백업
```bash
# 4GB 서버에서 백업
mysqldump -u root -p blog > blog_backup_$(date +%Y%m%d).sql
```

---

## 🎉 완료!

배포가 완료되었습니다. 질문이 있으면 로그를 확인하거나 위의 트러블슈팅 섹션을 참고하세요.
