import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: "primary" | "secondary" | "accent" | "destructive" | "warning";
  format?: "number" | "currency" | "percentage" | "hours";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color = "primary", 
  format = "number",
  trend 
}: KPICardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "hours":
        return `${val.toFixed(1)}h`;
      default:
        return val.toLocaleString("pt-BR");
    }
  };

  const colorVariants = {
    primary: "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10",
    secondary: "border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10", 
    accent: "border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10",
    destructive: "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10",
    warning: "border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10"
  };

  const iconColorVariants = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent", 
    destructive: "text-destructive",
    warning: "text-orange-500"
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg", colorVariants[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">
              {formatValue(value, format)}
            </p>
            {trend && (
              <div className="flex items-center space-x-1">
                <span className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" ? "text-green-600" : "text-red-600"
                )}>
                  {trend.direction === "up" ? "↗" : "↘"} {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-full bg-background/50",
            iconColorVariants[color]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}