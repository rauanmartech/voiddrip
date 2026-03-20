const GeoDivider = () => {
  return (
    <div className="geo-divider flex items-center justify-center">
      <div className="absolute w-full flex items-center justify-center px-4 md:px-0">
        <div className="h-[0.5px] bg-white/10 flex-grow max-w-[400px]"></div>
        <div className="mx-8 relative">
          <div className="black-hole">
            <div className="black-hole-ring w-[24px] h-[24px]" />
            <div className="black-hole-ring w-[32px] h-[32px] opacity-60" style={{ animationDuration: "15s" }} />
            <div className="black-hole-ring w-[40px] h-[40px] opacity-30" style={{ animationDuration: "25s" }} />
            <div className="absolute inset-0 bg-white/5 blur-md rounded-full animate-pulse pointer-events-none" />
          </div>
        </div>
        <div className="h-[0.5px] bg-white/10 flex-grow max-w-[400px]"></div>
      </div>
    </div>
  );
};

export default GeoDivider;
