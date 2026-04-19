import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Global types for MercadoPago SDK
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CardPaymentFormProps {
  orderId: string;
  amount: number;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CardPaymentForm({ orderId, amount, email, onSuccess, onCancel }: CardPaymentFormProps) {
  const controllerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentBrand, setPaymentBrand] = useState<string>("");

  useEffect(() => {
    // Per MP docs: always destroy the instance when leaving the screen
    return () => {
      if (controllerRef.current) {
        try { controllerRef.current.unmount(); } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    const tryInit = () => {
      if (window.MercadoPago) {
        init();
      } else {
        setTimeout(tryInit, 200);
      }
    };

    const init = async () => {
      try {
        const publicKey = (
          import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY ||
          "APP_USR-654fa0c2-8c62-47cf-a072-7b0fa8dedf38"
        ).trim();

        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

        // Diagnostic
        console.log("MP instance keys:", Object.keys(mp));
        console.log("mp.bricks type:", typeof mp.bricks);

        if (typeof mp.bricks !== 'function') {
          toast.error(
            `Card Payment Brick indisponível para esta conta. Métodos MP: ${Object.keys(mp).join(', ')}`,
            { duration: 15000 }
          );
          setIsReady(true); // unblock the UI
          return;
        }

        const bricksBuilder = mp.bricks();
        console.log("bricksBuilder obtained:", typeof bricksBuilder?.create);

        // Timeout: if onReady never fires within 12s, surface an error
        const readyTimeout = setTimeout(() => {
          console.error("Brick onReady timeout — never fired after 12s");
          toast.error("O formulário de pagamento demorou para carregar. Verifique o console e tente recarregar.");
          setIsReady(true);
        }, 12000);

        const settings = {
          initialization: {
            amount: amount,
            payer: { email: email },
          },
          customization: {
            visual: {
              hideFormTitle: true,        // We use our own header
              hidePaymentButton: false,
              style: {
                theme: "dark",
                customVariables: {
                  // Typography
                  textPrimaryColor: "#ffffff",
                  textSecondaryColor: "rgba(255,255,255,0.45)",
                  fontSizeSmall: "11px",
                  fontSizeMedium: "13px",
                  fontSizeLarge: "15px",
                  fontWeightNormal: "400",
                  fontWeightSemiBold: "600",

                  // Form background
                  formBackgroundColor: "transparent",

                  // Input fields
                  inputBackgroundColor: "rgba(255,255,255,0.04)",
                  // NOTE: inputBorderColor, inputFocusedBorderColor, fontFamily
                  // are NOT valid Bricks customVariables — removed to avoid warnings.
                  inputFocusedBoxShadow: "0 0 0 2px rgba(132,204,22,0.15)",
                  inputBorderWidth: "1px",
                  inputVerticalPadding: "14px",
                  inputHorizontalPadding: "16px",

                  // Border radius — sleek rounded
                  borderRadiusSmall: "6px",
                  borderRadiusMedium: "8px",
                  borderRadiusLarge: "10px",
                  borderRadiusFull: "999px",

                  // Accent / button
                  baseColor: "#84cc16",
                  buttonTextColor: "#000000",

                  // Feedback colors
                  errorColor: "#f87171",
                  successColor: "#4ade80",
                  warningColor: "#facc15",
                },
              },
            },
            paymentMethods: {
              minInstallments: 1,
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              clearTimeout(readyTimeout);
              setIsReady(true);
            },
            onBinChange: (bin: string) => {
              if (bin && bin.length >= 6) {
                // Try to derive brand from BIN prefix
                const b = bin.substring(0, 1);
                if (b === '4') setPaymentBrand('visa');
                else if (b === '5' || b === '2') setPaymentBrand('master');
                else if (b === '3') setPaymentBrand('amex');
                else if (b === '6') setPaymentBrand('elo');
                else setPaymentBrand('');
              } else {
                setPaymentBrand('');
              }
            },
            onSubmit: (formData: any, additionalData: any) => {
              return new Promise<void>((resolve, reject) => {
                supabase.functions
                  .invoke("process-payment", {
                    body: {
                      orderId,
                      paymentMethodId: formData.payment_method_id,
                      token: formData.token,
                      installments: String(formData.installments),
                      payerEmail: formData.payer?.email || email,
                      amount,
                      paymentType: additionalData?.paymentTypeId || "credit_card",
                      identification: formData.payer?.identification,
                    },
                  })
                  .then(({ data, error }) => {
                    if (error) { toast.error(error.message || "Falha no pagamento."); reject(); return; }
                    // /v1/payments returns "approved"; /v1/orders returns "processed"
                    const successStatuses = ["approved", "processed", "action_required", "authorized"];
                    if (successStatuses.includes(data?.status)) {
                      toast.success("Pagamento aprovado!");
                      onSuccess();
                      resolve();
                    } else if (data?.status === "in_process" || data?.status === "pending") {
                      toast.success("Pagamento em análise. Você será notificado em breve.");
                      onSuccess();
                      resolve();
                    } else {
                      const detail = data?.status_detail || data?.status || "recusado";
                      toast.error(`Pagamento ${detail}. Verifique os dados do cartão e tente novamente.`);
                      reject();
                    }
                  })
                  .catch((err: any) => { toast.error(err.message || "Erro ao processar."); reject(); });
              });
            },
            onError: (error: any) => {
              console.error("Brick error:", error);
            },
          },
        };

        console.log("Calling bricksBuilder.create()...");
        const controller = await bricksBuilder.create(
          "cardPayment",
          "cardPaymentBrick_container",
          settings
        );
        console.log("Brick created:", controller);
        controllerRef.current = controller;
      } catch (err: any) {
        console.error("MP Brick init error:", err);
        toast.error("Erro: " + err.message);
        setIsReady(true);
      }
    };

    tryInit();
  }, [amount, email, orderId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-10"
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CreditCard className="text-primary" size={15} />
          </div>
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.3em] leading-none">Cartão de Crédito</h3>
            <p className="text-[9px] text-muted-foreground tracking-widest mt-1">Débito &amp; crédito aceitos</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] text-primary font-bold uppercase tracking-tighter">
          <ShieldCheck size={9} /> PCI
        </div>
      </div>

      {/* ── Loading bar ────────────────────────────── */}
      {!isReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 space-y-3"
        >
          <div className="flex items-center gap-3 py-3.5 px-4 rounded-xl border border-white/8 bg-white/[0.03]">
            <Loader2 size={14} className="animate-spin text-primary shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Inicializando formulário seguro...
            </span>
          </div>
          {/* Skeleton shimmer */}
          <div className="space-y-2.5 opacity-30">
            {[1, 2, 2].map((cols, i) => (
              <div key={i} className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: cols }).map((_, j) => (
                  <div key={j} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Card Mockup ─────────────────────────────── */}
      <div className="relative w-full max-w-xs mx-auto mb-8" style={{ aspectRatio: '1.586/1' }}>
        {/* Card body */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}>
          {/* Animated shimmer */}
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite' }} />
          {/* Glow accent */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.08) 0%, transparent 70%)' }} />

          <div className="relative z-10 p-6 h-full flex flex-col justify-between">
            {/* Top row */}
            <div className="flex justify-between items-start">
              {/* Chip */}
              <div className="w-10 h-8 rounded-md border border-amber-400/30"
                style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))' }} />
              {/* Brand */}
              {paymentBrand ? (
                <span className="text-white/70 text-[10px] uppercase tracking-[0.3em] font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {paymentBrand}
                </span>
              ) : (
                <div className="w-10 h-6 rounded bg-white/5 animate-pulse" />
              )}
            </div>

            {/* Bottom row */}
            <div className="space-y-3">
              <div className="text-white/20 tracking-[0.3em] text-sm" style={{ fontFamily: 'Orbitron, monospace' }}>
                {paymentBrand ? '**** **** **** ****' : '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">Card Holder</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {email?.split('@')[0]?.substring(0, 14).toUpperCase() || 'TITULAR'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">Expires</div>
                  <div className="text-[10px] text-white/50" style={{ fontFamily: 'Orbitron, monospace' }}>MM/AA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brick container ────────────────────────── */}
      {/*
        IMPORTANT: This div must always be in the DOM.
        DO NOT add overflow-hidden, display:none, h-0, or visibility on it.
        The Brick renders its own iframes inside here.
      */}
      <div
        id="cardPaymentBrick_container"
        className={`transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0 h-0 pointer-events-none"}`}
      />

      {/* ── Footer ─────────────────────────────────── */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-4"
        >
          <div className="text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold hover:text-white transition-colors"
            >
              ← Voltar para opções
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-1.5 opacity-30">
              <ShieldCheck size={10} className="text-primary" />
              <span className="text-[8px] uppercase tracking-widest">Ambiente PCI Compliant</span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
