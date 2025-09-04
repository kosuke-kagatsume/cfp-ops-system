import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  delta?: number;
  target?: number;
  description?: string;
  helpText?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  delta,
  target,
  description,
  helpText
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (!delta) return <Minus className="h-4 w-4 text-gray-400" />;
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };
  
  const getTrendColor = () => {
    if (!delta) return 'text-gray-600';
    if (delta > 0) return 'text-green-600';
    return 'text-red-600';
  };
  
  const getTargetStatus = () => {
    if (!target || typeof value !== 'number') return null;
    const achievement = (value / target) * 100;
    if (achievement >= 95) return 'success';
    if (achievement >= 80) return 'warning';
    return 'danger';
  };
  
  const targetStatus = getTargetStatus();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {targetStatus && (
            <Badge variant={
              targetStatus === 'success' ? 'default' : 
              targetStatus === 'warning' ? 'secondary' : 
              'destructive'
            }>
              {targetStatus === 'success' ? '達成' : 
               targetStatus === 'warning' ? '要注意' : 
               '要改善'}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-xs mt-1">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        
        {delta !== undefined && (
          <div className="flex items-center mt-2 space-x-1">
            {getTrendIcon()}
            <span className={`text-sm ${getTrendColor()}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">前時間比</span>
          </div>
        )}
        
        {target && (
          <div className="mt-2 text-xs text-muted-foreground">
            目標: {target}{unit}
          </div>
        )}
        
        {helpText && (
          <div className="mt-2 text-xs text-muted-foreground italic">
            {helpText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}