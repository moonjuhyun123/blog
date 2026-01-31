#!/bin/bash
# k3s 배포 스크립트

set -e

echo "========================================"
echo "Blog Application - k3s Deployment"
echo "========================================"
echo

# 변수 설정
NAMESPACE="${NAMESPACE:-default}"
BACKEND_IMAGE="${BACKEND_IMAGE:-ghcr.io/YOUR_USERNAME/YOUR_REPO/backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ghcr.io/YOUR_USERNAME/YOUR_REPO/frontend:latest}"
DOMAIN="${DOMAIN:-yourdomain.com}"

echo "📋 Configuration:"
echo "  Namespace: $NAMESPACE"
echo "  Backend Image: $BACKEND_IMAGE"
echo "  Frontend Image: $FRONTEND_IMAGE"
echo "  Domain: $DOMAIN"
echo

# 네임스페이스 확인
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "📦 Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE"
else
    echo "✓ Namespace already exists: $NAMESPACE"
fi

# 백엔드 배포
echo
echo "🚀 Deploying backend..."
kubectl apply -f backend-deployment.yaml -n "$NAMESPACE"

# 프론트엔드 배포
echo
echo "🚀 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml -n "$NAMESPACE"

# cert-manager 확인 (HTTPS용)
echo
echo "🔒 Checking cert-manager..."
if kubectl get namespace cert-manager &> /dev/null; then
    echo "✓ cert-manager found"
    
    # ClusterIssuer 배포
    if [ -f "cert-manager.yaml" ]; then
        echo "📝 Applying cert-manager configuration..."
        kubectl apply -f cert-manager.yaml
    fi
else
    echo "⚠️  cert-manager not found. HTTPS will not be available."
    echo "   To install: kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml"
fi

# Ingress 배포
echo
echo "🌐 Deploying Ingress..."
if [ -f "ingress-traefik.yaml" ]; then
    kubectl apply -f ingress-traefik.yaml -n "$NAMESPACE"
    echo "✓ Traefik Ingress applied"
elif [ -f "ingress.yaml" ]; then
    kubectl apply -f ingress.yaml -n "$NAMESPACE"
    echo "✓ NGINX Ingress applied"
else
    echo "⚠️  No ingress configuration found"
fi

# 배포 상태 확인
echo
echo "📊 Checking deployment status..."
kubectl get all -n "$NAMESPACE"

echo
echo "🔍 Checking ingress..."
kubectl get ingress -n "$NAMESPACE"

echo
echo "========================================"
echo "✅ Deployment completed!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Update DNS: $DOMAIN → $(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')"
echo "2. Monitor pods: kubectl get pods -n $NAMESPACE -w"
echo "3. View logs:"
echo "   - Backend:  kubectl logs -f deployment/blog-backend -n $NAMESPACE"
echo "   - Frontend: kubectl logs -f deployment/blog-frontend -n $NAMESPACE"
echo "4. Check ingress: kubectl describe ingress blog-ingress -n $NAMESPACE"
echo
