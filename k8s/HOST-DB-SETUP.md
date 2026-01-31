# 호스트 DB 연결 가이드

k3s pod에서 호스트 서버의 MariaDB/MySQL에 연결하는 방법입니다.

## 방법 1: host.k3s.internal 사용 (권장)

k3s는 기본적으로 `host.k3s.internal` 호스트명을 제공하여 pod에서 호스트에 접근할 수 있습니다.

### 1. database-config.yaml 설정

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-db-config
data:
  DB_HOST: "host.k3s.internal"
  DB_PORT: "3306"
  DB_NAME: "blog"
```

### 2. MariaDB 설정 확인

호스트 서버의 MariaDB가 외부 연결을 허용하도록 설정:

```bash
# /etc/mysql/mariadb.conf.d/50-server.cnf
sudo vi /etc/mysql/mariadb.conf.d/50-server.cnf
```

```ini
[mysqld]
# 0.0.0.0으로 변경 (모든 IP에서 접근 허용)
bind-address = 0.0.0.0
# 또는 k3s 네트워크만 허용
# bind-address = 10.42.0.0
```

```bash
# MariaDB 재시작
sudo systemctl restart mariadb
```

### 3. 방화벽 설정 (필요시)

```bash
# MariaDB 포트 개방 (k3s pod network에서만)
sudo ufw allow from 10.42.0.0/16 to any port 3306
# 또는 전체 개방 (보안 주의)
sudo ufw allow 3306
```

### 4. 사용자 권한 확인

```sql
-- MariaDB에 접속
sudo mysql -u root -p

-- 사용자가 모든 호스트에서 접속 가능한지 확인
SELECT user, host FROM mysql.user WHERE user='blog_user';

-- '%' 호스트로 권한 부여
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
```

## 방법 2: 호스트 IP 직접 사용

### 1. 호스트 IP 확인

```bash
# 서버의 IP 주소 확인
ip addr show
# 또는
hostname -I
```

### 2. ConfigMap 설정

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-db-config
data:
  DB_HOST: "192.168.1.100"  # 실제 호스트 IP로 변경
  DB_PORT: "3306"
  DB_NAME: "blog"
```

장점: 명확하고 확실함
단점: IP 변경 시 ConfigMap 수정 필요

## 방법 3: hostNetwork 사용

Pod가 호스트 네트워크를 직접 사용하도록 설정:

### backend-deployment.yaml 수정

```yaml
spec:
  template:
    spec:
      hostNetwork: true  # 추가
      dnsPolicy: ClusterFirstWithHostNet  # 추가
      containers:
      - name: backend
        ...
        env:
        - name: DB_HOST
          value: "localhost"  # localhost 사용 가능
```

장점: localhost로 접근 가능
단점: 
- 네트워크 격리 손실
- 포트 충돌 가능성
- 보안상 권장하지 않음

## 테스트

### 1. Pod에서 DB 연결 테스트

```bash
# 백엔드 pod에 접속
kubectl exec -it deployment/blog-backend -- /bin/sh

# telnet 또는 nc로 연결 테스트
apt-get update && apt-get install -y telnet
telnet host.k3s.internal 3306

# 또는 mysql 클라이언트로 직접 테스트
apt-get install -y mariadb-client
mysql -h host.k3s.internal -u blog_user -p blog
```

### 2. 애플리케이션 로그 확인

```bash
# 백엔드 로그 확인
kubectl logs -f deployment/blog-backend

# HikariCP 연결 성공 로그 확인:
# "HikariPool-1 - Starting..."
# "HikariPool-1 - Start completed."
```

## 문제 해결

### 문제 1: "Connection refused"

**원인**: MariaDB가 외부 연결을 허용하지 않음

**해결**:
```bash
# bind-address 확인
sudo grep bind-address /etc/mysql/mariadb.conf.d/50-server.cnf

# 0.0.0.0으로 변경 후 재시작
sudo systemctl restart mariadb

# 포트 리스닝 확인
sudo netstat -tlnp | grep 3306
```

### 문제 2: "Access denied"

**원인**: 사용자 권한 문제

**해결**:
```sql
-- 사용자 호스트 확인
SELECT user, host FROM mysql.user WHERE user='blog_user';

-- '%' 또는 특정 IP 범위로 재생성
DROP USER IF EXISTS 'blog_user'@'localhost';
CREATE USER 'blog_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
```

### 문제 3: "Unknown host: host.k3s.internal"

**원인**: k3s 버전 또는 설정 문제

**해결**:
- k3s 버전 업그레이드 (v1.21+)
- 호스트 IP를 직접 사용 (방법 2)
- `/etc/hosts`에 수동 추가 (deployment에서)

### 문제 4: 방화벽 차단

```bash
# 방화벽 상태 확인
sudo ufw status

# k3s pod network 확인
kubectl get nodes -o wide

# k3s pod CIDR 확인 (보통 10.42.0.0/16)
kubectl cluster-info dump | grep -i cluster-cidr

# 방화벽 규칙 추가
sudo ufw allow from 10.42.0.0/16 to any port 3306
```

## 보안 권장사항

### 1. 특정 네트워크만 허용

```bash
# k3s pod network만 허용
sudo ufw allow from 10.42.0.0/16 to any port 3306
sudo ufw deny 3306
```

### 2. MariaDB 사용자 제한

```sql
-- 특정 IP 범위만 허용
CREATE USER 'blog_user'@'10.42.%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'10.42.%';
```

### 3. SSL/TLS 연결 사용

```yaml
# application.yml
datasource:
  url: jdbc:mariadb://host:3306/db?useSSL=true&requireSSL=true
```

## 성능 최적화

### 1. Unix Socket 사용 (hostNetwork 사용 시)

```yaml
datasource:
  url: jdbc:mariadb://localhost:3306/blog?localSocket=/var/run/mysqld/mysqld.sock
```

### 2. 연결 풀 설정 조정

호스트 DB를 사용하므로 네트워크 레이턴시가 낮음:

```yaml
datasource:
  hikari:
    connection-timeout: 10000  # 10초로 감소
    maximum-pool-size: 30      # 증가 가능
```

## 예제: 전체 설정

```bash
# 1. MariaDB 설정
sudo vi /etc/mysql/mariadb.conf.d/50-server.cnf
# bind-address = 0.0.0.0

sudo systemctl restart mariadb

# 2. 사용자 생성
sudo mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
EOF

# 3. 방화벽 설정
sudo ufw allow from 10.42.0.0/16 to any port 3306

# 4. k8s 배포
cd k8s
# database-config.yaml에서 DB_HOST를 host.k3s.internal로 설정
kubectl apply -f database-config.yaml
./deploy.sh

# 5. 테스트
kubectl logs -f deployment/blog-backend
```

## 참고

- k3s pod network CIDR: `10.42.0.0/16` (기본값)
- k3s service CIDR: `10.43.0.0/16` (기본값)
- 호스트 접근: `host.k3s.internal` (k3s v1.21+)
