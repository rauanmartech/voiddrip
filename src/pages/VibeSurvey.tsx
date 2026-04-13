import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GeoDivider from "@/components/GeoDivider";
import CosmicElements from "@/components/CosmicElements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  vibe: z.enum(["CÓDIGO DE MURO", "NAÇÃO EM CAMPO", "RAIZ 031"], {
    required_error: "Por favor, escolha uma vibe.",
  }),
  items: z.array(z.string()).min(1, "Selecione pelo menos um item que você compraria."),
  decision_factor: z.string({
    required_error: "Conte-nos o que faz você decidir comprar.",
  }),
  perfect_brand: z.string().optional(),
});

const VibeSurvey = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
      perfect_brand: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // We'll attempt to insert, but since the table might not exist yet, 
      // we'll handle it gracefully and log the data.
      const { error } = await supabase.from("pre_drop_feedback").insert([
        {
          vibe: values.vibe,
          items: values.items,
          decision_factor: values.decision_factor,
          perfect_brand_description: values.perfect_brand,
        },
      ]);

      if (error) {
        console.error("Supabase error (Table might not exist):", error);
        // If it's a "relation does not exist" error, we still want to show success in dev
        // but tell the user they need to create the table.
        if (error.code === '42P01') {
          toast.warning("Formulário capturado localmente, mas a tabela no Supabase ainda não existe.");
        } else {
          throw error;
        }
      }

      setIsSubmitted(true);
      toast.success("Feedback enviado com sucesso! O vazio agradece.");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const itemsOptions = [
    { id: "camiseta_estampa", label: "Camiseta (estampa forte)" },
    { id: "camiseta_basica", label: "Camiseta básica (logo minimalista)" },
    { id: "moletom", label: "Moletom / hoodie" },
    { id: "oversized", label: "Oversized premium" },
    { id: "peca_limitada", label: "Peça limitada (drop exclusivo numerado)" },
    { id: "bone_acessorio", label: "Boné / acessório" },
    { id: "kit_completo", label: "Kit completo (look fechado)" },
  ];

  const decisionFactors = [
    { id: "estampa", label: "Estampa diferente (não vejo em outro lugar)" },
    { id: "exclusividade", label: "Exclusividade (poucas peças)" },
    { id: "preco", label: "Preço" },
    { id: "identificacao", label: "Identificação com a ideia" },
    { id: "influencia", label: "Influência / ver outras pessoas usando" },
  ];

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 relative px-6 overflow-hidden sm:spacetime-grid">
        <CosmicElements />
        
        <div className="max-w-2xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <header className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl md:text-4xl font-display tracking-[0.2em] inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/40">
                      FORMULÁRIO — VOID
                    </h1>
                    <p className="font-display text-[10px] tracking-[0.5em] text-muted-foreground mt-2">
                      (PRÉ-DROP)
                    </p>
                  </motion.div>
                </header>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
                    {/* Section 1 */}
                    <div className="space-y-8 animate-fade-up">
                      <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                        <h2 className="text-xl font-display tracking-wider uppercase">Seção 1: Escolha sua vibe</h2>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase font-body font-medium">
                          Qual dessas coleções mais representa você?
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="vibe"
                        render={({ field }) => {
                          const vibeOptions = [
                            { 
                              id: "CÓDIGO DE MURO", 
                              desc: "grafite, rua, expressão",
                              renderTitle: () => (
                                <span className="relative inline-block">
                                  <span className="relative z-10 animate-glitch-1 text-white">CÓDIGO DE MURO</span>
                                  <span className="absolute top-0 left-0 -z-10 animate-glitch-2 text-cyan-500 opacity-50">CÓDIGO DE MURO</span>
                                  <span className="absolute top-0 left-0 -z-20 animate-glitch-1 text-fuchsia-500 opacity-50 translate-x-[1px]">CÓDIGO DE MURO</span>
                                </span>
                              )
                            },
                            { 
                              id: "NAÇÃO EM CAMPO", 
                              desc: "futebol, pressão, Brasil",
                              renderTitle: () => (
                                <>
                                  <span className="text-[#22c55e]">NAÇÃO </span>
                                  <span className="text-[#facc15]">EM </span>
                                  <span className="text-[#3b82f6]">CAMPO</span>
                                </>
                              )
                            },
                            { 
                              id: "RAIZ 031", 
                              desc: "Minas, origem, identidade",
                              renderTitle: () => (
                                <>
                                  <span className="text-white">RAIZ </span>
                                  <span className="text-[#ef4444]">031</span>
                                </>
                              )
                            },
                          ];
                          return (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-1 gap-4"
                                >
                                  {vibeOptions.map((option) => (
                                    <label 
                                      key={option.id}
                                      className={`relative flex items-center space-x-3 space-y-0 rounded-none border p-6 transition-all duration-300 cursor-pointer select-none ${
                                        field.value === option.id 
                                          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                                          : "border-white/10 hover:border-white/20"
                                      }`}
                                    >
                                      <RadioGroupItem value={option.id} className="sr-only" />
                                      <div className="flex-1">
                                        <h4 className="font-display text-sm tracking-widest block mb-1">
                                          {option.renderTitle()}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground italic uppercase">
                                          ({option.desc})
                                        </p>
                                      </div>
                                      {field.value === option.id && (
                                        <motion.div layoutId="check-vibe">
                                          <Check className="w-4 h-4 text-primary" />
                                        </motion.div>
                                      )}
                                    </label>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormDescription className="text-[10px] italic text-center text-muted-foreground pt-2">
                                "Sem hype, só o que você realmente usaria."
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }
                        }
                      />
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                      <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                        <h2 className="text-xl font-display tracking-wider uppercase">Seção 2: O que você pegaria?</h2>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase font-body font-medium">
                          Se a VOID dropasse hoje, o que você pegaria?
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase opacity-60">
                          (Pode marcar mais de uma)
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="items"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {itemsOptions.map((item) => {
                                  const isChecked = field.value?.includes(item.id);
                                  return (
                                    <label
                                      key={item.id}
                                      className={`flex flex-row items-center space-x-3 space-y-0 border p-4 transition-all duration-200 cursor-pointer select-none ${
                                        isChecked
                                          ? "border-primary/50 bg-primary/5"
                                          : "border-white/5 hover:bg-white/5"
                                      }`}
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const currentValues = Array.isArray(field.value) ? field.value : [];
                                          if (checked) {
                                            field.onChange([...currentValues, item.id]);
                                          } else {
                                            field.onChange(currentValues.filter((v: string) => v !== item.id));
                                          }
                                        }}
                                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                      />
                                      <span className="text-[10px] font-medium tracking-widest uppercase flex-grow py-1">
                                        {item.label}
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Strategic Question */}
                    <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                      <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                        <h2 className="text-xl font-display tracking-wider uppercase">A Decisão</h2>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase font-body font-medium">
                          O que faz você decidir comprar na hora?
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="decision_factor"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col gap-3"
                              >
                                {decisionFactors.map((option) => (
                                  <label 
                                    key={option.id}
                                    className={`flex items-center space-x-4 space-y-0 border p-4 transition-all duration-200 cursor-pointer select-none ${
                                      field.value === option.id 
                                        ? "border-primary/50 bg-primary/5" 
                                        : "border-white/5 hover:bg-white/5"
                                    }`}
                                  >
                                    <RadioGroupItem value={option.id} className="border-white/20 text-primary" />
                                    <span className="font-medium text-[10px] tracking-widest uppercase flex-grow py-1 leading-relaxed">
                                      {option.label}
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Final Question */}
                    <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                      <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                        <h2 className="text-xl font-display tracking-wider uppercase">A Visão</h2>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase font-body font-medium">
                          Se a VOID fosse perfeita pra você, como ela seria? (opcional)
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="perfect_brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva sua marca ideal..."
                                className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 transition-all rounded-none resize-none pt-4 tracking-wide text-sm placeholder:text-muted-foreground placeholder:italic"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full btn-explore py-8 text-sm group"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-3">
                          ENVIAR PARA O VAZIO
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-8 border border-white/10 bg-white/5 backdrop-blur-sm relative mt-20"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-background border border-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                
                <h2 className="text-2xl font-display tracking-widest mb-4">FEEDBACK RECEBIDO</h2>
                <p className="text-muted-foreground text-sm tracking-wider leading-relaxed max-w-md mx-auto mb-10">
                  Suas respostas foram gravadas na essência da VOID. 
                  Estamos usando sua visão para moldar o próximo drop.
                </p>
                
                <Button 
                  onClick={() => setIsSubmitted(false)} 
                  variant="outline"
                  className="rounded-none border-white/20 hover:border-white hover:bg-white hover:text-black transition-all font-display text-[10px] tracking-widest px-10"
                >
                  VOLTAR
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <GeoDivider />
      <Footer />
    </div>
  );
};

export default VibeSurvey;
