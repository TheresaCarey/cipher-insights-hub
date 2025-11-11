import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: "emerald" | "orange" | "cyan" | "amber" | "violet";
}

const colorClasses = {
  emerald: "text-chart-emerald",
  orange: "text-chart-orange",
  cyan: "text-chart-cyan",
  amber: "text-chart-amber",
  violet: "text-chart-violet",
};

export const StatWidget = ({ title, value, icon: Icon, trend, color }: StatWidgetProps) => {
  return (
    <Card className="transition-all hover:shadow-lg" style={{ boxShadow: "var(--shadow-widget)" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
};
