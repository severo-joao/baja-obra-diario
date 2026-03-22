import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Check if session already exists (hash already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // Timeout fallback for expired/invalid links
        timeout = setTimeout(() => {
          setExpired(true);
        }, 5000);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (expired && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-extrabold text-lg">B</span>
          </div>
          <p className="text-destructive text-sm font-medium">Link expirado ou inválido.</p>
          <p className="text-muted-foreground text-sm">Solicite um novo link de recuperação de senha.</p>
          <Button variant="outline" onClick={() => navigate("/auth")}>Voltar ao login</Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-extrabold text-lg">B</span>
          </div>
          <p className="text-muted-foreground text-sm">Verificando link...</p>
          <Loader2 className="animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-extrabold text-lg">B</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Definir Senha</h1>
          <p className="text-sm text-muted-foreground">Crie sua senha para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Senha</Label>
            <Input id="confirm" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Definir Senha
          </Button>
        </form>
      </div>
    </div>
  );
}
