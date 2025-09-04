'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Mail,
  Calendar,
  Activity,
  Info
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plantIds: string[];
  isActive: boolean;
  lastLoginTs?: string;
  createdTs: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      name: '田中太郎',
      email: 'tanaka@cfp-company.com',
      role: 'operator',
      plantIds: ['okayama'],
      isActive: true,
      lastLoginTs: '2025-08-01T10:30:00+09:00',
      createdTs: '2025-06-01T09:00:00+09:00'
    },
    {
      id: 'user-002',
      name: '佐藤花子',
      email: 'sato@cfp-company.com',
      role: 'plant_manager',
      plantIds: ['okayama', 'minohama'],
      isActive: true,
      lastLoginTs: '2025-08-01T08:15:00+09:00',
      createdTs: '2025-05-15T14:30:00+09:00'
    },
    {
      id: 'user-003',
      name: '鈴木一郎',
      email: 'suzuki@cfp-company.com',
      role: 'hq_exec',
      plantIds: ['okayama', 'minohama', 'arashiyama', 'takamatsu'],
      isActive: true,
      lastLoginTs: '2025-07-31T16:45:00+09:00',
      createdTs: '2025-04-01T10:00:00+09:00'
    },
    {
      id: 'user-004',
      name: '山田美咲',
      email: 'yamada@cfp-company.com',
      role: 'quality',
      plantIds: ['okayama'],
      isActive: true,
      createdTs: '2025-07-01T11:20:00+09:00'
    },
    {
      id: 'user-005',
      name: '高橋健太',
      email: 'takahashi@cfp-company.com',
      role: 'accounting',
      plantIds: [],
      isActive: false,
      lastLoginTs: '2025-07-20T13:10:00+09:00',
      createdTs: '2025-03-15T16:45:00+09:00'
    }
  ]);

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'operator',
    plantIds: [],
    isActive: true
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    operator: 'オペレーター',
    plant_manager: 'プラント管理者',
    hq_exec: '本社役員',
    quality: '品質管理',
    accounting: '経理',
    external_viewer: '外部閲覧者',
    admin: 'システム管理者'
  };

  const roleColors: Record<UserRole, string> = {
    operator: 'bg-blue-100 text-blue-800',
    plant_manager: 'bg-green-100 text-green-800',
    hq_exec: 'bg-purple-100 text-purple-800',
    quality: 'bg-amber-100 text-amber-800',
    accounting: 'bg-pink-100 text-pink-800',
    external_viewer: 'bg-gray-100 text-gray-800',
    admin: 'bg-red-100 text-red-800'
  };

  const plants = [
    { id: 'okayama', name: '岡山ケミカルセンター' },
    { id: 'minohama', name: '箕浜リサイクル工場' },
    { id: 'arashiyama', name: '嵐山処理センター' },
    { id: 'takamatsu', name: '高松ケミカル工場' }
  ];

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error('必須項目を入力してください');
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      plantIds: newUser.plantIds || [],
      isActive: newUser.isActive || true,
      createdTs: new Date().toISOString()
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'operator', plantIds: [], isActive: true });
    setIsDialogOpen(false);
    toast.success(`ユーザー ${user.name} を作成しました`);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setEditingUser(null);
    setIsDialogOpen(false);
    toast.success(`ユーザー ${editingUser.name} を更新しました`);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success(`ユーザー ${user.name} を削除しました`);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: Object.entries(roleLabels).map(([role, label]) => ({
      role: role as UserRole,
      label,
      count: users.filter(u => u.role === role).length
    }))
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
        <p className="text-muted-foreground mt-1">
          ユーザーアカウントとアクセス権限の管理
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          MVPではローカル状態管理です。実際のユーザー認証システムは今後実装予定です。
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総ユーザー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{userStats.total}</span>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              アクティブユーザー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{userStats.active}</span>
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              管理者
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin' || u.role === 'hq_exec').length}
              </span>
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              外部ユーザー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {users.filter(u => u.role === 'external_viewer').length}
              </span>
              <Eye className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">ユーザー一覧</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUser(null);
              setNewUser({ name: '', email: '', role: 'operator', plantIds: [], isActive: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              新規ユーザー
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
              </DialogTitle>
              <DialogDescription>
                ユーザー情報とアクセス権限を設定してください
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  value={editingUser?.name || newUser.name || ''}
                  onChange={(e) => {
                    if (editingUser) {
                      setEditingUser({ ...editingUser, name: e.target.value });
                    } else {
                      setNewUser({ ...newUser, name: e.target.value });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser?.email || newUser.email || ''}
                  onChange={(e) => {
                    if (editingUser) {
                      setEditingUser({ ...editingUser, email: e.target.value });
                    } else {
                      setNewUser({ ...newUser, email: e.target.value });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">ロール</Label>
                <Select
                  value={editingUser?.role || newUser.role}
                  onValueChange={(value: UserRole) => {
                    if (editingUser) {
                      setEditingUser({ ...editingUser, role: value });
                    } else {
                      setNewUser({ ...newUser, role: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                  {editingUser ? '更新' : '作成'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">ユーザー一覧</TabsTrigger>
          <TabsTrigger value="roles">ロール別統計</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name}</h3>
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={user.isActive ? 'bg-green-600' : ''}
                          >
                            {user.isActive ? '有効' : '無効'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <Badge className={roleColors[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                          {user.lastLoginTs && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              最終ログイン: {new Date(user.lastLoginTs).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>
                        {user.plantIds.length > 0 && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              {user.plantIds.map(plantId => {
                                const plant = plants.find(p => p.id === plantId);
                                return plant ? (
                                  <Badge key={plantId} variant="outline" className="text-xs">
                                    {plant.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(user);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.isActive ? '無効化' : '有効化'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {userStats.byRole.map((roleStat) => (
              <Card key={roleStat.role}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {roleStat.label}
                    <Badge className={roleColors[roleStat.role]}>
                      {roleStat.count}名
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.filter(u => u.role === roleStat.role).map(user => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span>{user.name}</span>
                        <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                          {user.isActive ? '有効' : '無効'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}