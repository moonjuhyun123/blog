#!/bin/bash
# 빠른 배포 스크립트 - 2서버 구성 (4GB DB + 8GB K3s)

set -e

echo "========================================"
echo "Blog Application - Quick Deploy"
echo "2-Server Setup (4GB DB + 8GB K3s)"
echo "========================================"
echo

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 변수 설정
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMESPACE="${NAMESPACE:-default}"
DB_HOST="${DB_HOST:-}"

echo "📋 Configuration:"
echo "  Project Root: $PROJECT_ROOT"
echo "  Namespace: $NAMESPACE"
echo

# 사전 확인
echo "🔍 Pre-flight checks..."

# kubectl 확인
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} kubectl found"

# docker 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} docker found"

# k3s 클러스터 확인
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ k3s cluster not accessible${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} k3s cluster accessible"

echo

# DB 연결 정보 확인
if [ -z "$DB_HOST" ]; then
    echo -e "${YELLOW}⚠️  DB_HOST not set${NC}"
    echo "Please check k8s/database-config.yaml for DB connection settings"
    echo
fi

# 1단계: 백엔드 빌드
echo "========================================"
echo "Step 1: Building Backend (Maven)"
echo "========================================"

cd "$PROJECT_ROOT/backend"

# Maven 확인
if [ -f "mvnw" ]; then
    echo "Using Maven Wrapper..."
    chmod +x mvnw
    ./mvnw clean package -DskipTests
elif command -v mvn &> /dev/null; then
    echo "Using system Maven..."
    mvn clean package -DskipTests
else
    echo -e "${RED}❌ Maven not found${NC}"
    echo "Please install Maven or use Maven Wrapper"
    exit 1
fi

echo -e "${GREEN}✓${NC} Backend built successfully"
echo

# 2단계: Docker 이미지 빌드
echo "========================================"
echo "Step 2: Building Docker Images"
echo "========================================"

cd "$PROJECT_ROOT"

# 백엔드 이미지 빌드
echo "🔨 Building backend image..."
docker build -f Dockerfile.backend -t blog-backend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend image built"
else
    echo -e "${RED}❌ Backend image build failed${NC}"
    exit 1
fi

# 프론트엔드 이미지 빌드
echo "🔨 Building frontend image..."
docker build -f Dockerfile.frontend -t blog-frontend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend image built"
else
    echo -e "${RED}❌ Frontend image build failed${NC}"
    exit 1
fi

# 이미지 확인
echo
echo "📦 Docker images:"
docker images | grep blog

echo

# 3단계: Kubernetes 리소스 배포
echo "========================================"
echo "Step 3: Deploying to Kubernetes"
echo "========================================"

cd "$PROJECT_ROOT/k8s"

# 네임스페이스 확인/생성
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "📦 Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE"
else
    echo -e "${GREEN}✓${NC} Namespace exists: $NAMESPACE"
fi

# DB ConfigMap/Secret 확인
echo
echo "💾 Checking database configuration..."
if ! kubectl get configmap blog-db-config -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Database ConfigMap not found${NC}"
    echo "Creating from database-config.yaml..."
    kubectl apply -f database-config.yaml -n "$NAMESPACE"
else
    echo -e "${GREEN}✓${NC} Database ConfigMap found"
fi

if ! kubectl get secret blog-db-secret -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Database Secret not found${NC}"
    echo "Creating from database-config.yaml..."
    kubectl apply -f database-config.yaml -n "$NAMESPACE"
else
    echo -e "${GREEN}✓${NC} Database Secret found"
fi

# 백엔드 배포
echo
echo "🚀 Deploying backend..."
kubectl apply -f backend-deployment.yaml -n "$NAMESPACE"
echo -e "${GREEN}✓${NC} Backend deployed"

# 프론트엔드 배포
echo
echo "🚀 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml -n "$NAMESPACE"
echo -e "${GREEN}✓${NC} Frontend deployed"

# 배포 대기
echo
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=blog-backend -n "$NAMESPACE" --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=blog-frontend -n "$NAMESPACE" --timeout=120s || true

# 4단계: 배포 상태 확인
echo
echo "========================================"
echo "Step 4: Deployment Status"
echo "========================================"

echo
echo "📊 All resources:"
kubectl get all -n "$NAMESPACE"

echo
echo "🔍 Pod details:"
kubectl get pods -n "$NAMESPACE" -o wide

echo
echo "📝 Services:"
kubectl get svc -n "$NAMESPACE"

# 로그 미리보기
echo
echo "========================================"
echo "Recent Logs Preview"
echo "========================================"

echo
echo "📋 Backend logs (last 10 lines):"
kubectl logs -n "$NAMESPACE" -l app=blog-backend --tail=10 || echo "No logs yet"

echo
echo "📋 Frontend logs (last 10 lines):"
kubectl logs -n "$NAMESPACE" -l app=blog-frontend --tail=10 || echo "No logs yet"

# 완료 메시지
echo
echo "========================================"
echo "✅ Deployment Completed!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Check pod status:"
echo "   kubectl get pods -n $NAMESPACE -w"
echo
echo "2. View backend logs:"
echo "   kubectl logs -f deployment/blog-backend -n $NAMESPACE"
echo
echo "3. View frontend logs:"
echo "   kubectl logs -f deployment/blog-frontend -n $NAMESPACE"
echo
echo "4. Test backend API (port-forward):"
echo "   kubectl port-forward svc/blog-backend 8080:8080 -n $NAMESPACE"
echo "   curl http://localhost:8080/actuator/health"
echo
echo "5. Test frontend (port-forward):"
echo "   kubectl port-forward svc/blog-frontend 3000:3000 -n $NAMESPACE"
echo "   Open browser: http://localhost:3000"
echo
echo "6. Check pod health:"
echo "   kubectl describe pod <pod-name> -n $NAMESPACE"
echo

# 리소스 사용량
echo "💻 Resource usage:"
kubectl top nodes 2>/dev/null || echo "Metrics not available (install metrics-server)"
kubectl top pods -n "$NAMESPACE" 2>/dev/null || echo "Pod metrics not available"

echo
echo "🎉 All done!"
echo
