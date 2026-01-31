-- Blog Application Database Initialization
-- MariaDB/MySQL
--
-- 사용법:
-- sudo mysql -u root -p < db-init.sql
--
-- 주의: 'CHANGE_THIS_PASSWORD'를 실제 비밀번호로 변경하세요!

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS blog 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
-- 경고: 'CHANGE_THIS_PASSWORD'를 강력한 비밀번호로 변경하세요!
CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON blog.* TO 'blog_user'@'%';
FLUSH PRIVILEGES;

-- 데이터베이스 선택
USE blog;

-- Spring Boot JPA가 자동으로 테이블을 생성합니다.
-- 관리자 계정은 AdminInitializer.java에서 자동 생성됩니다.

-- 생성된 사용자 확인
SELECT user, host FROM mysql.user WHERE user='blog_user';

-- 연결 테스트
SELECT 'Database initialized successfully!' AS status;
SELECT CONCAT('Database: ', DATABASE()) AS current_db;
