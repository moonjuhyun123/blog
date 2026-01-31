# DB 설정 명령어 (4GB 서버)

## 🎯 본 프로젝트 DB 계정

- **사용자명**: `csr`
- **비밀번호**: `csrpass`
- **데이터베이스**: `blog`

---

## 📝 4GB DB 서버 설정

### 1. MariaDB 외부 접근 허용

```bash
# bind-address 설정
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf

# MariaDB 재시작
sudo systemctl restart mariadb
```

### 2. 데이터베이스 및 사용자 생성

```bash
sudo mysql -u root -p << 'EOF'
-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER IF NOT EXISTS 'csr'@'%' IDENTIFIED BY 'csrpass';
GRANT ALL PRIVILEGES ON blog.* TO 'csr'@'%';
FLUSH PRIVILEGES;

-- 확인
SELECT user, host FROM mysql.user WHERE user='csr';
SHOW GRANTS FOR 'csr'@'%';
EOF
```

### 3. 방화벽 설정

```bash
# K3s 서버 네트워크 대역 허용
sudo ufw allow from 172.30.1.0/24 to any port 3306

# 방화벽 상태 확인
sudo ufw status
```

### 4. 설정 확인

```bash
# MariaDB 리스닝 확인
sudo netstat -tlnp | grep 3306
# 결과: 0.0.0.0:3306 으로 리스닝 중이어야 함

# 사용자 확인
sudo mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='csr';"
# 결과: csr | %
```

---

## 🧪 연결 테스트

### 4GB 서버 (로컬)에서:

```bash
mysql -u csr -pcsrpass -e "SHOW DATABASES;"
# blog 데이터베이스가 보여야 함
```

### 8GB K3s 서버에서:

```bash
mysql -h 172.30.1.85 -u csr -pcsrpass -e "SHOW DATABASES;"
# blog 데이터베이스가 보여야 함
```

### K3s Pod에서:

```bash
kubectl run -it --rm mysql-test --image=mysql:8 --restart=Never -- \
  mysql -h 172.30.1.85 -u csr -pcsrpass -e "SHOW DATABASES;"
# blog 데이터베이스가 보여야 함
```

---

## 🔧 트러블슈팅

### 문제: Access denied

```bash
# 사용자 권한 재설정
sudo mysql -u root -p << 'EOF'
DROP USER IF EXISTS 'csr'@'%';
CREATE USER 'csr'@'%' IDENTIFIED BY 'csrpass';
GRANT ALL PRIVILEGES ON blog.* TO 'csr'@'%';
FLUSH PRIVILEGES;
EOF
```

### 문제: Connection refused

```bash
# bind-address 확인
sudo grep bind-address /etc/mysql/mariadb.conf.d/50-server.cnf
# 결과: bind-address = 0.0.0.0 이어야 함

# 0.0.0.0이 아니면 수정
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
```

### 문제: 방화벽 차단

```bash
# 방화벽 규칙 확인
sudo ufw status numbered

# 3306 포트 규칙 추가
sudo ufw allow from 172.30.1.0/24 to any port 3306

# 또는 전체 허용 (테스트용)
sudo ufw allow 3306
```

---

## 📋 GitHub Secret 설정

### GitHub 저장소에서:

```
Settings → Secrets and variables → Actions → New repository secret

Name: DB_PASSWORD
Secret: csrpass
```

---

## ✅ 체크리스트

4GB DB 서버 설정:
- [ ] MariaDB 설치 완료
- [ ] bind-address = 0.0.0.0 설정
- [ ] MariaDB 재시작
- [ ] blog 데이터베이스 생성
- [ ] csr 사용자 생성 (비밀번호: csrpass)
- [ ] csr 사용자 권한 부여 (blog.*)
- [ ] 방화벽 3306 포트 허용
- [ ] 로컬 연결 테스트 성공
- [ ] 8GB 서버에서 연결 테스트 성공

GitHub 설정:
- [ ] DB_PASSWORD Secret 추가 (값: csrpass)

---

## 🎉 완료!

이제 GitHub Actions CI/CD가 자동으로 이 DB 계정을 사용합니다.

```bash
git push origin main
# 자동 배포 시작! 🚀
```
