'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, User } from 'lucide-react';
import { PlantId } from '@/types';

const plants = [
  { id: 'okayama' as PlantId, name: '岡山ケミカルセンター', isEnabled: true },
  { id: 'minohama' as PlantId, name: '蓑浜工場', isEnabled: false },
  { id: 'arashiyama' as PlantId, name: '嵐山工場', isEnabled: false },
  { id: 'takamatsu' as PlantId, name: '高松ケミカル', isEnabled: false },
];

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <div className="border-b">
      <div className="bg-yellow-50 px-4 py-2">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            データは約30-60分遅延しています。最終更新: 2025-08-01 14:30
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl">CFP Ops</span>
          </Link>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                    ダッシュボード
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>工場管理</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/plants/okayama/overview"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            岡山ケミカル
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            リアルタイム監視とKPI管理
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/plants/okayama/alerts" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">アラート</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            アラート管理とACK
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/plants/okayama/inventory" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">在庫</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            タンク在庫管理
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/plants/okayama/quality" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">品質</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            ロット品質管理
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/shipments" className={navigationMenuTriggerStyle()}>
                    出荷管理
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>レポート</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/reports/monthly-internal" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">内部月次</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            KPI・アラート・出荷サマリ
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/reports/monthly-external" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">外部月次</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            顧客向けレポート
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>システム</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-3 p-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/admin" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">管理画面</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            ユーザー管理・統合設定
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/portal" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">顧客ポータル</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            外部顧客向けレポート
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/plants/okayama/lineage" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">系譜ビュー</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            入荷→処理→出荷の追跡
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Select defaultValue="okayama">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="プラントを選択" />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem 
                  key={plant.id} 
                  value={plant.id}
                  disabled={!plant.isEnabled}
                >
                  {plant.name}
                  {!plant.isEnabled && <span className="ml-2 text-muted-foreground">(準備中)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span className="text-sm">operator01@cfp.jp</span>
          </div>
        </div>
      </div>
    </div>
  );
}