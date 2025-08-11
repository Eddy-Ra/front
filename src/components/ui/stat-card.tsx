import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className,
  style
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden glass border-white/20 hover-lift hover-glow animate-scale-in", className)} style={style}>
      <CardContent className="p-6 relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-glass opacity-50 rounded-lg" />
        
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground font-poppins">{title}</p>
            <p className="text-3xl font-bold text-foreground font-poppins bg-gradient-primary bg-clip-text text-transparent">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground font-poppins">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold font-poppins px-2 py-1 rounded-full backdrop-blur-sm",
                trend.isPositive 
                  ? "text-success-foreground bg-gradient-success/20 border border-success/30" 
                  : "text-destructive-foreground bg-destructive/20 border border-destructive/30"
              )}>
                <span className="text-foreground">{trend.isPositive ? "+" : ""}{trend.value}%</span>
                <span className="text-muted-foreground">vs mois dernier</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="rounded-xl bg-gradient-primary/20 backdrop-blur-sm p-4 border border-white/20">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}