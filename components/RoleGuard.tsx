'use client';

import React from 'react';
import { UserRole, UserPermissions, ROLE_PERMISSIONS } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  allowedRoles?: UserRole[];
  currentUserRole: UserRole;
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredPermission,
  allowedRoles,
  currentUserRole,
  fallback,
  showAlert = true
}: RoleGuardProps) {
  let hasAccess = false;

  if (requiredPermission) {
    // Check if current user role has the required permission
    hasAccess = ROLE_PERMISSIONS[currentUserRole][requiredPermission];
  } else if (allowedRoles) {
    // Check if current user role is in the allowed roles list
    hasAccess = allowedRoles.includes(currentUserRole);
  } else {
    // If neither permission nor roles specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAlert) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            この機能にアクセスする権限がありません。
            {requiredPermission && (
              <span className="block text-sm mt-1">
                必要な権限: {getPermissionName(requiredPermission)}
              </span>
            )}
            {allowedRoles && (
              <span className="block text-sm mt-1">
                許可ロール: {allowedRoles.map(role => getRoleName(role)).join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

export function usePermission(permission: keyof UserPermissions, userRole: UserRole): boolean {
  return ROLE_PERMISSIONS[userRole][permission];
}

export function useRole(userRole: UserRole) {
  return {
    role: userRole,
    permissions: ROLE_PERMISSIONS[userRole],
    hasPermission: (permission: keyof UserPermissions) => ROLE_PERMISSIONS[userRole][permission],
    isRole: (role: UserRole) => userRole === role,
    isAnyRole: (roles: UserRole[]) => roles.includes(userRole)
  };
}

// Mock user context (in real app this would come from auth context)
export function MockUserProvider({ children, role = 'operator' }: { 
  children: React.ReactNode;
  role?: UserRole;
}) {
  return (
    <div data-user-role={role}>
      {children}
    </div>
  );
}

// Helper functions for display names
function getPermissionName(permission: keyof UserPermissions): string {
  const names: Record<keyof UserPermissions, string> = {
    viewDashboard: 'ダッシュボード閲覧',
    viewAlerts: 'アラート閲覧',
    ackAlerts: 'アラート対応',
    viewTanks: 'タンク状況閲覧',
    manageTanks: 'タンク管理',
    viewQuality: '品質データ閲覧',
    manageQuality: '品質データ管理',
    viewShipments: '出荷情報閲覧',
    manageShipments: '出荷情報管理',
    viewLineage: '系譜情報閲覧',
    viewReports: 'レポート閲覧',
    manageUsers: 'ユーザー管理',
    systemAdmin: 'システム管理',
    viewFinancial: '財務情報閲覧',
    manageIntegrations: '外部連携管理',
    uploadData: 'データアップロード'
  };
  return names[permission];
}

function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    operator: 'オペレーター',
    plant_manager: 'プラント管理者',
    hq_exec: '本社役員',
    quality: '品質管理',
    accounting: '経理',
    external_viewer: '外部閲覧者',
    admin: 'システム管理者'
  };
  return names[role];
}