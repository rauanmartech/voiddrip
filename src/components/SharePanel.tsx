import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Share2, X } from "lucide-react";
import { toast } from "sonner";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SharePanelProps {
  productId: string;
  productName: string;
  productDescription?: string;
  productPrice: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SharePanel = ({
  productId,
  productName,
  productDescription,
  productPrice,
}: SharePanelProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const productUrl = `https://www.voiddrip.com.br/produto/${productId}`;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(productPrice);

  const shareText = productDescription
    ? `*${productName}* — ${formattedPrice}\n\n${productDescription.slice(0, 120)}...\n\n🔗 ${productUrl}`
    : `*${productName}* — ${formattedPrice}\n\nConfira na Void Drip Society 🖤\n\n🔗 ${productUrl}`;

  // ── Share handlers ──────────────────────────────────────────────────────────

  const handleWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleInstagram = async () => {
    // Instagram doesn't support direct URL sharing.
    // On mobile: use native Web Share API (shows Instagram in share sheet).
    // On desktop: copy the link and open Instagram.
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `${productName} — ${formattedPrice}\n\n${productDescription?.slice(0, 120) ?? ""}`,
          url: productUrl,
        });
        setOpen(false);
        return;
      } catch {
        // User cancelled or share failed — fall through
      }
    }
    // Fallback: copy to clipboard + open Instagram
    await navigator.clipboard.writeText(productUrl);
    toast.success("Link copiado! Cole no Instagram Stories ou Feed 🖤", {
      description: productUrl,
      duration: 4000,
    });
    setTimeout(() => {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }, 500);
    setOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  // ── Share options config ────────────────────────────────────────────────────

  const options = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      sublabel: "Compartilhar via mensagem",
      icon: <WhatsAppIcon />,
      onClick: handleWhatsApp,
      gradient: "from-[#25D366] to-[#128C7E]",
      glow: "rgba(37,211,102,0.4)",
      border: "border-[#25D366]/30",
      textColor: "text-[#25D366]",
    },
    {
      id: "instagram",
      label: "Instagram",
      sublabel: "Compartilhar no Stories ou Feed",
      icon: <InstagramIcon />,
      onClick: handleInstagram,
      gradient: "from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]",
      glow: "rgba(253,29,29,0.3)",
      border: "border-[#FD1D1D]/30",
      textColor: "text-transparent bg-clip-text bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]",
    },
    {
      id: "copy",
      label: copied ? "Link copiado!" : "Copiar link",
      sublabel: "Copiar URL do produto",
      icon: copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      onClick: handleCopyLink,
      gradient: "from-[#4a4a4a] to-[#2a2a2a]",
      glow: "rgba(255,255,255,0.1)",
      border: "border-white/10",
      textColor: "text-white/70",
    },
  ];

  return (
    <>
      {/* ── Trigger Button ──────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        className="relative flex items-center justify-center gap-2.5 w-full py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group overflow-hidden"
      >
        {/* Subtle shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.8s_infinite] pointer-events-none" />
        <Share2 size={15} className="text-white/50 group-hover:text-white/80 transition-colors" />
        <span className="font-display text-[10px] tracking-[0.35em] uppercase text-white/50 group-hover:text-white/80 transition-colors">
          COMPARTILHAR
        </span>
      </motion.button>

      {/* ── Modal Overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm w-full z-50"
            >
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 pb-8 md:pb-6 shadow-[0_-20px_80px_rgba(0,0,0,0.8)]">

                {/* Decorative top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Drag pill (mobile) */}
                <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6 md:hidden" />

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-display text-sm tracking-[0.25em] uppercase text-white mb-1">
                      Compartilhar
                    </h3>
                    <p className="font-body text-[11px] text-white/40 leading-relaxed max-w-[220px] truncate">
                      {productName}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X size={13} className="text-white/50" />
                  </button>
                </div>

                {/* URL Preview */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-6 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 flex-shrink-0 animate-pulse" />
                  <span className="font-mono text-[10px] text-white/30 truncate flex-1">
                    voiddrip.com.br/produto/{productId.slice(0, 8)}...
                  </span>
                </div>

                {/* Share Options */}
                <div className="flex flex-col gap-3">
                  {options.map((opt, i) => (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={opt.onClick}
                      whileTap={{ scale: 0.97 }}
                      className={`relative group flex items-center gap-4 px-4 py-3.5 rounded-xl border ${opt.border} bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 overflow-hidden text-left`}
                    >
                      {/* Glow effect on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                        style={{
                          boxShadow: `inset 0 0 20px ${opt.glow}`,
                        }}
                      />

                      {/* Icon with gradient background */}
                      <div
                        className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center flex-shrink-0 text-white shadow-lg`}
                        style={{ boxShadow: `0 4px 20px ${opt.glow}` }}
                      >
                        {opt.icon}
                      </div>

                      {/* Labels */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className={`font-display text-xs tracking-[0.15em] uppercase font-semibold ${opt.textColor}`}
                        >
                          {opt.label}
                        </span>
                        <span className="font-body text-[10px] text-white/30 mt-0.5">
                          {opt.sublabel}
                        </span>
                      </div>

                      {/* Arrow indicator */}
                      <div className="text-white/20 group-hover:text-white/50 transition-colors text-xs">›</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SharePanel;
