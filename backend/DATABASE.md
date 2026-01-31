# Database Configuration Guide

## 커넥션 풀 설정 (HikariCP)

Spring Boot 3.5에서는 **HikariCP**가 기본 커넥션 풀로 자동 설정됩니다.

### 현재 설정 (application.yml - prod profile)

```yaml
datasource:
  hikari:
    minimum-idle: 5                    # 최소 유휴 커넥션 수
    maximum-pool-size: 20              # 최대 커넥션 풀 크기
    connection-timeout: 30000          # 커넥션 타임아웃 (30초)
    idle-timeout: 600000               # 유휴 커넥션 타임아웃 (10분)
    max-lifetime: 1800000              # 커넥션 최대 생명주기 (30분)
    connection-test-query: SELECT 1    # 커넥션 테스트 쿼리
    leak-detection-threshold: 60000    # 누수 감지 (1분)
```

### 설정 값 권장사항

#### 소규모 서비스 (동시 사용자 < 100)
- `minimum-idle`: 5
- `maximum-pool-size`: 10-20

#### 중규모 서비스 (동시 사용자 100-1000)
- `minimum-idle`: 10
- `maximum-pool-size`: 20-50

#### 대규모 서비스 (동시 사용자 > 1000)
- `minimum-idle`: 20
- `maximum-pool-size`: 50-100

### 공식 권장사항

**maximum-pool-size 계산식**:
```
pool_size = Tn × (Cm − 1) + 1

Tn = 스레드 수 (총 동시 요청 수)
Cm = 각 스레드가 동시에 필요한 커넥션 수 (보통 1)
```

예: 100개의 동시 요청 → pool_size = 100 × (1 - 1) + 1 = **10개 권장**

## 로컬 개발 환경

### 1. H2 데이터베이스 (기본)

```bash
# dev 프로파일로 실행 (기본값)
./mvnw spring-boot:run

# H2 Console 접속
http://localhost:8081/h2-console
```

**연결 정보**:
- JDBC URL: `jdbc:h2:mem:myproject`
- Username: `sa`
- Password: (비어있음)

### 2. 외부 MariaDB/MySQL 사용

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정
vi .env
```

```properties
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blog
DB_USER=blog_user
DB_PASSWORD=your-password
```

```bash
# prod 프로파일로 실행
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

## 프로덕션 환경 (k3s/Kubernetes)

### 1. 데이터베이스 생성

```sql
-- MariaDB/MySQL에 접속하여 실행
CREATE DATABASE IF NOT EXISTS blog 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'blog_user'@'%' 
  IDENTIFIED BY 'your-secure-password';

GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;
```

또는 제공된 스크립트 사용:
```bash
mysql -h your-db-host -u root -p < k8s/db-init.sql
```

### 2. Kubernetes ConfigMap & Secret 생성

```bash
cd k8s

# database-config.yaml 수정
vi database-config.yaml

# 적용
kubectl apply -f database-config.yaml
```

### 3. 배포 확인

```bash
# Pod 로그 확인
kubectl logs -f deployment/blog-backend

# HikariCP 초기화 로그 확인
# "HikariPool-1 - Starting..." 메시지가 나타나야 함
```

## 커넥션 풀 모니터링

### 1. Actuator 엔드포인트

```bash
# Health Check
curl http://localhost:8080/actuator/health

# Metrics
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
curl http://localhost:8080/actuator/metrics/hikaricp.connections.idle
curl http://localhost:8080/actuator/metrics/hikaricp.connections.max
```

### 2. 주요 메트릭

- `hikaricp.connections.active` - 활성 커넥션 수
- `hikaricp.connections.idle` - 유휴 커넥션 수
- `hikaricp.connections.pending` - 대기 중인 요청 수
- `hikaricp.connections.timeout` - 타임아웃 발생 수
- `hikaricp.connections.acquire` - 커넥션 획득 시간

### 3. 로그 레벨 설정

```yaml
# application.yml
logging:
  level:
    com.zaxxer.hikari: DEBUG
```

## 문제 해결

### 1. "HikariPool - Connection is not available"

**원인**: 커넥션 풀이 가득 참

**해결**:
- `maximum-pool-size` 증가
- 커넥션 누수 확인 (`leak-detection-threshold` 로그 확인)
- 장기 실행 쿼리 최적화

### 2. "Communications link failure"

**원인**: DB 서버와 연결 불가

**해결**:
- DB 호스트/포트 확인
- 네트워크/방화벽 확인
- DB 서버 상태 확인

### 3. "Access denied for user"

**원인**: 인증 정보 오류

**해결**:
- DB 사용자명/비밀번호 확인
- 사용자 권한 확인
- Secret 설정 확인 (k8s)

### 4. 커넥션 누수

**증상**: 시간이 지나면서 사용 가능한 커넥션 감소

**해결**:
```yaml
hikari:
  leak-detection-threshold: 30000  # 30초 후 경고
```

로그에서 누수 발생 지점 확인 후 코드 수정

## 성능 튜닝

### 1. 연결 유지 (Keep-Alive)

```yaml
datasource:
  url: jdbc:mariadb://host:3306/db?...&tcpKeepAlive=true
```

### 2. 배치 처리

```yaml
jpa:
  properties:
    hibernate:
      jdbc:
        batch_size: 20  # 배치 크기
```

### 3. 읽기 전용 최적화

```java
@Transactional(readOnly = true)
public List<Post> findAll() {
    // ...
}
```

### 4. 쿼리 캐시

```yaml
jpa:
  properties:
    hibernate:
      cache:
        use_second_level_cache: true
        use_query_cache: true
```

## 백업 권장사항

```bash
# 정기 백업 (cron)
0 2 * * * mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD blog > /backup/blog_$(date +\%Y\%m\%d).sql
```

## 참고 자료

- [HikariCP 공식 문서](https://github.com/brettwooldridge/HikariCP)
- [Spring Boot Data Access](https://docs.spring.io/spring-boot/docs/current/reference/html/data.html)
- [MariaDB 최적화](https://mariadb.com/kb/en/optimization/)
