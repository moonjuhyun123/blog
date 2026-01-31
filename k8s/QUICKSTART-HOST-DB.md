# 빠른 시작: 호스트 DB 연결

k3s pod에서 호스트 서버의 MariaDB에 연결하는 빠른 설정 가이드입니다.

## 1단계: MariaDB 설정 (호스트 서버)

```bash
# 1. MariaDB 외부 접근 허용
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf

# 2. MariaDB 재시작
sudo systemctl restart mariadb

# 3. 데이터베이스 및 사용자 생성
sudo mysql -u root -p <<'EOF'
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='blog_user';
EOF

# 4. 방화벽 설정 (k3s pod network만 허용)
sudo ufw allow from 10.42.0.0/16 to any port 3306

# 5. 연결 확인
sudo netstat -tlnp | grep 3306
# 0.0.0.0:3306 으로 리스닝하는지 확인
```

## 2단계: Kubernetes 설정

```bash
cd k8s

# 1. database-config.yaml 수정
cat > database-config.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-db-config
data:
  DB_HOST: "host.k3s.internal"  # k3s에서 호스트 접근
  DB_PORT: "3306"
  DB_NAME: "blog"
---
apiVersion: v1
kind: Secret
metadata:
  name: blog-db-secret
type: Opaque
stringData:
  DB_USER: "blog_user"
  DB_PASSWORD: "your-secure-password"  # 실제 비밀번호로 변경!
EOF

# 2. Secret 적용
kubectl apply -f database-config.yaml

# 3. 확인
kubectl get configmap blog-db-config
kubectl get secret blog-db-secret
```

## 3단계: 연결 테스트

```bash
# Pod에서 직접 MariaDB 연결 테스트
kubectl run -it --rm mariadb-test --image=mariadb:10 --restart=Never -- \
  mysql -h host.k3s.internal -u blog_user -pyour-secure-password -e "SHOW DATABASES;"

# 성공하면 blog 데이터베이스가 보여야 함
```

## 4단계: 애플리케이션 배포

```bash
# 1. CI/CD 이미지 경로 확인 또는 수정
vi backend-deployment.yaml
vi frontend-deployment.yaml

# 2. 배포
./deploy.sh

# 3. 로그 확인
kubectl logs -f deployment/blog-backend

# "HikariPool-1 - Start completed." 메시지 확인
```

## 트러블슈팅

### 문제: "Connection refused"

```bash
# 원인 확인
sudo netstat -tlnp | grep 3306

# bind-address 확인
sudo grep bind-address /etc/mysql/mariadb.conf.d/50-server.cnf

# 127.0.0.1이면 0.0.0.0으로 변경 필요
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
```

### 문제: "Access denied"

```bash
# 사용자 권한 재설정
sudo mysql -u root -p <<'EOF'
DROP USER IF EXISTS 'blog_user'@'%';
CREATE USER 'blog_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='blog_user';
EOF
```

### 문제: "Unknown host: host.k3s.internal"

```bash
# k3s 버전 확인 (v1.21+ 필요)
k3s --version

# 또는 호스트 IP 직접 사용
# database-config.yaml에서:
# DB_HOST: "192.168.1.100"  # 실제 호스트 IP
```

### 문제: Pod에서 호스트 접근 불가

```bash
# k3s pod network CIDR 확인
kubectl cluster-info dump | grep -m1 cluster-cidr

# 방화벽에 해당 네트워크 허용
sudo ufw allow from 10.42.0.0/16 to any port 3306

# 또는 임시로 전체 허용 (테스트용)
sudo ufw allow 3306
```

## 확인 체크리스트

- [ ] MariaDB bind-address가 0.0.0.0인지
- [ ] MariaDB가 3306 포트에서 리스닝 중인지
- [ ] blog 데이터베이스가 생성되었는지
- [ ] blog_user@'%' 사용자가 존재하는지
- [ ] 방화벽에서 3306 포트가 허용되었는지
- [ ] k8s ConfigMap과 Secret이 생성되었는지
- [ ] Pod에서 host.k3s.internal로 연결 가능한지

## 요약

```bash
# 호스트 서버 (MariaDB 설정)
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
sudo mysql -u root -p < k8s/db-init.sql
sudo ufw allow from 10.42.0.0/16 to any port 3306

# k3s (애플리케이션 배포)
cd k8s
vi database-config.yaml  # DB_HOST: host.k3s.internal, 비밀번호 수정
kubectl apply -f database-config.yaml
./deploy.sh
kubectl logs -f deployment/blog-backend
```

완료!
