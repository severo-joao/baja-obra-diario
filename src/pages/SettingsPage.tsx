import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurações gerais do sistema</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Em breve</p>
          <p className="text-sm mt-1">As configurações do sistema estarão disponíveis em uma próxima atualização.</p>
        </CardContent>
      </Card>
    </div>
  );
}
