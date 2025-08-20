import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Clock,
  FileText,
  CreditCard,
  TrendingUp,
  Wallet,
  Calculator,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

const menuItems = [
  { 
    title: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard, 
    description: "Visão geral do sistema" 
  },
  {
    title: "Cadastros & Estruturas",
    href: "/cadastros",
    icon: Building2,
    description: "Clientes, fornecedores, projetos",
    badge: "Base"
  },
  {
    title: "Vendas & Pedidos",
    href: "/vendas",
    icon: ShoppingCart,
    description: "Pedidos, contratos e backlog"
  },
  {
    title: "Times, Horas & Despesas",
    href: "/horas",
    icon: Clock,
    description: "Apontamentos e POC"
  },
  {
    title: "Faturação & Recebíveis",
    href: "/faturacao",
    icon: FileText,
    description: "Faturas e aging"
  },
  {
    title: "Compromissos & Pagáveis",
    href: "/compromissos",
    icon: CreditCard,
    description: "Fornecedores e pagamentos"
  },
  {
    title: "Custos, ACT vs BGT",
    href: "/custos",
    icon: TrendingUp,
    description: "Orçamento vs realizado"
  },
  {
    title: "Tesouraria",
    href: "/tesouraria",
    icon: Wallet,
    description: "Posição de caixa"
  },
  {
    title: "Contabilidade",
    href: "/contabilidade",
    icon: Calculator,
    description: "Exportações contábeis"
  },
  {
    title: "Analytics & Relatórios",
    href: "/analytics",
    icon: BarChart3,
    description: "Dashboards gerenciais"
  },
  {
    title: "Governança",
    href: "/governanca",
    icon: Shield,
    description: "Segurança e parâmetros"
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-secondary transition-all duration-300",
        isCollapsed ? "w-16" : "w-80",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
            <div>
              <h1 className="text-lg font-bold text-secondary-foreground">
                SynchroProfitHub
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão Integrada
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left",
                    isCollapsed && "px-2",
                    isActive && "bg-primary text-primary-foreground shadow-primary"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0")} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.badge && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-70 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Sistema Integrado v1.0</p>
            <p>Projetos & Finanças</p>
          </div>
        </div>
      )}
    </div>
  );
}