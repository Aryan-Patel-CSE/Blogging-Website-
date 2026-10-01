const Logo = ({ width = "100px", className = "" }) => {

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`} style={{ maxWidth: width }}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200 text-white flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent leading-none">
          InkSpace
        </span>
        <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-semibold mt-0.5">
          Stories & Ideas
        </span>
      </div>
    </div>
  );
};

export default Logo;