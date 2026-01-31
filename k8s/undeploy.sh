#!/bin/bash
# k3s 배포 제거 스크립트

set -e

NAMESPACE="${NAMESPACE:-default}"

echo "========================================"
echo "Blog Application - k3s Undeployment"
echo "========================================"
echo
echo "⚠️  This will delete all blog resources in namespace: $NAMESPACE"
echo
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo "🗑️  Deleting resources..."

# Ingress 삭제
kubectl delete ingress blog-ingress -n "$NAMESPACE" --ignore-not-found=true

# Deployment 및 Service 삭제
kubectl delete -f frontend-deployment.yaml -n "$NAMESPACE" --ignore-not-found=true
kubectl delete -f backend-deployment.yaml -n "$NAMESPACE" --ignore-not-found=true

echo
echo "✅ Resources deleted from namespace: $NAMESPACE"
echo
echo "To delete the namespace:"
echo "  kubectl delete namespace $NAMESPACE"
echo
