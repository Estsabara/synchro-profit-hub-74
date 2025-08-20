import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Sistema de Gestão</span>
          </div>
          <Button variant="outline" asChild>
            <Link to="/auth">Fazer Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            Versão 1.0 - Completa
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Gestão Integrada de Projetos e Finanças
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema completo com módulos de cadastros, vendas, horas, faturação, 
            compromissos, custos, tesouraria, contabilidade, analytics e governança.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Button size="lg" className="bg-gradient-primary text-white shadow-elegant" asChild>
              <Link to="/auth">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Fazer Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Módulos Disponíveis</h2>
            <p className="text-muted-foreground">Sistema completo e totalmente funcional</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Cadastros</CardTitle>
                <CardDescription>
                  Entidades, contatos, endereços, projetos, centros de custo e tarifas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Vendas & Pedidos</CardTitle>
                <CardDescription>
                  Gestão de pedidos, backlog, margem e cronogramas de faturamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Horas & Despesas</CardTitle>
                <CardDescription>
                  Lançamento de horas, despesas, POC e calculadora de projetos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Faturação</CardTitle>
                <CardDescription>
                  Faturas, contas a receber, aging de clientes e gestão de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Compromissos</CardTitle>
                <CardDescription>
                  Commitments, contas a pagar, agendamento e execução de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Custos</CardTitle>
                <CardDescription>
                  Orçamentos, ACT vs BGT, análise de undercoverage e controle de custos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Tesouraria</CardTitle>
                <CardDescription>
                  Posição de caixa, projeções, conciliação bancária e execução de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Contabilidade</CardTitle>
                <CardDescription>
                  Mapeamento gerencial, lançamentos consolidados, balancetes e exportações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Dashboards visuais, relatórios customizáveis e histórico de KPIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle border-primary/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Governança</CardTitle>
                <CardDescription>
                  Identidade, workflows, auditoria, permissões e parametrizações globais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Completo</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sistema completo de gestão integrada com todos os módulos funcionais
          </p>
          <Button size="lg" className="bg-gradient-primary text-white shadow-elegant" asChild>
            <Link to="/auth">
              Acessar Sistema
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container max-w-4xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Sistema de Gestão Integrada. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}