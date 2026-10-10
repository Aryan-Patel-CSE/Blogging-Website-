const Logo = ({ width = "100px", className = "" }) => {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none app-logo ${className}`} style={{ maxWidth: width }}>
      <div className="app-logo__icon w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] via-[#FF8533] to-[#FF5500] flex items-center justify-center shadow-md shadow-[#FF6B00]/35 text-white flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="app-logo__title text-xl font-extrabold text-slate-900 dark:text-white leading-none">
          Ink<span className="app-logo__accent text-[#FF6B00] dark:text-[#FF7A18]">Space</span>
        </span>
        <span className="app-logo__tagline text-[9px] uppercase tracking-widest text-[#FF6B00] dark:text-[#FF7A18] font-bold mt-0.5">
          Stories & Ideas
        </span>
      </div>
    </div>
  );
};

export default Logo;