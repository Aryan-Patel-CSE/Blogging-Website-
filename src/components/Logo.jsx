const Logo = ({ width = "100px", className = "" }) => {

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`} style={{ maxWidth: width }}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7A1CAC] via-[#AD49E1] to-[#7A1CAC] flex items-center justify-center shadow-md shadow-[#7A1CAC]/30 text-white flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold bg-gradient-to-r from-[#2E073F] via-[#7A1CAC] to-[#2E073F] dark:from-white dark:via-[#EBD3F8] dark:to-white bg-clip-text text-transparent leading-none">
          InkSpace
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[#7A1CAC] dark:text-[#AD49E1] font-bold mt-0.5">
          Stories & Ideas
        </span>
      </div>
    </div>
  );
};

export default Logo;