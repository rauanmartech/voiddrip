import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";

const AdminArea = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);


  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("Credenciais inválidas: " + error.message);
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const ADMIN_EMAIL = "rauanrocha.martech@gmail.com";
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-background relative flex flex-col uppercase">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 relative spacetime-grid flex items-center justify-center">
        <CosmicElements />
        <div className="relative z-10 w-full max-w-md px-6">
          {!session ? (
            <div className="product-card p-8 text-center bg-card/80 backdrop-blur-sm border-white/10">
              <h1 className="font-display text-2xl tracking-[0.2em] text-foreground mb-2">
                ACESSO RESTRITO
              </h1>
              <p className="font-body text-[10px] tracking-[0.3em] text-muted-foreground mb-8">
                PAINEL DO ADMINISTRADOR
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
                {error && (
                  <div className="text-destructive text-[10px] bg-destructive/10 p-2 border border-destructive/20 font-display">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[8px] tracking-[0.4em] text-muted-foreground">EMAIL</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-display"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[8px] tracking-[0.4em] text-muted-foreground">SENHA</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-display"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-explore mt-4 w-full text-center py-4 text-[10px]"
                >
                  {loading ? "SINCROZINANDO..." : "AUTENTICAR ACESSO"}
                </button>
              </form>
            </div>
          ) : !isAdmin ? (
            <div className="product-card p-8 text-center bg-card/80 backdrop-blur-sm border-red-500/20">
              <h1 className="font-display text-xl tracking-[0.2em] text-red-500 mb-2">
                ACESSO NEGADO
              </h1>
              <p className="font-body text-xs text-muted-foreground mb-8">
                Esta área é restrita para o desenvolvedor principal.
              </p>
              <button
                onClick={handleLogout}
                className="btn-explore w-full text-center py-3"
              >
                SAIR
              </button>
            </div>
          ) : (
            <div className="product-card p-8 text-center bg-card/80 backdrop-blur-sm border-primary/20">
              <h1 className="font-display text-2xl tracking-[0.2em] text-primary mb-2">
                PAINEL ADM
              </h1>
              <p className="font-body text-xs text-muted-foreground mb-8">
                DOMÍNIO DE: {session.user.email}
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="btn-explore w-full text-center py-3 mt-2"
                >
                  VOLTAR PARA O SITE
                </button>

                <button
                  onClick={handleLogout}
                  className="text-xs tracking-[0.2em] uppercase border border-border text-muted-foreground hover:bg-border transition-all duration-300 py-3 mt-4 font-display"
                >
                  SAIR
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminArea;
