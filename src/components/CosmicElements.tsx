const CosmicElements = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {/* Large ring top-right */}
      <div
        className="cosmic-ring w-[500px] h-[500px] -top-40 -right-40 animate-pulse-glow"
        style={{ borderWidth: "0.5px" }}
      />
      {/* Small ring bottom-left */}
      <div
        className="cosmic-ring w-[200px] h-[200px] bottom-20 -left-20 animate-pulse-glow"
        style={{ borderWidth: "0.5px", animationDelay: "2s" }}
      />
      {/* Radial lines */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10" viewBox="0 0 800 800">
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="400"
            y1="400"
            x2={400 + 400 * Math.cos((i * 30 * Math.PI) / 180)}
            y2={400 + 400 * Math.sin((i * 30 * Math.PI) / 180)}
            stroke="hsl(0 0% 30%)"
            strokeWidth="0.3"
          />
        ))}
        <circle cx="400" cy="400" r="150" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="0.3" />
        <circle cx="400" cy="400" r="300" fill="none" stroke="hsl(0 0% 20%)" strokeWidth="0.3" />
      </svg>
    </div>
  );
};

export default CosmicElements;
