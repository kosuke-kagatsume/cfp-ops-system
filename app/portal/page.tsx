'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { LogIn, Building2, Lock } from 'lucide-react';

export default function PortalLoginPage() {
  const [credentials, setCredentials] = useState({
    customerId: '',
    password: ''
  });

  const handleLogin = () => {
    // Mock login - redirect to dashboard
    window.location.href = '/portal/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold mt-4">CFP顧客ポータル</h1>
          <p className="text-muted-foreground mt-2">
            リサイクル実績とCO₂削減効果をご確認ください
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              ログイン
            </CardTitle>
            <CardDescription>
              顧客IDとパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">顧客ID</Label>
              <Input
                id="customerId"
                placeholder="C001"
                value={credentials.customerId}
                onChange={(e) => setCredentials({
                  ...credentials,
                  customerId: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={credentials.password}
                onChange={(e) => setCredentials({
                  ...credentials,
                  password: e.target.value
                })}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={!credentials.customerId || !credentials.password}
            >
              ログイン
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>初回ログインの方は担当者にお問い合わせください</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <p>このサイトは SSL暗号化により保護されています</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          <Link href="/" className="text-primary hover:underline">
            社内システムへ
          </Link>
        </div>
      </div>
    </div>
  );
}