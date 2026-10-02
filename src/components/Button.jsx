const Button = ({ 

  children,
  type = 'button',
  bgColor,
  textColor,
  className = '',
  classname = '',
  disabled = false,
  loading = false,
  ...props
}) => {
  const combinedCustomClass = className || classname;
  const defaultBg = bgColor || 'bg-[#1D4ED8] hover:bg-[#3B82F6] active:bg-[#1E3A8A] dark:bg-[#7A1CAC] dark:hover:bg-[#AD49E1] dark:active:bg-[#2E073F] shadow-sm shadow-[#1D4ED8]/25 dark:shadow-[#7A1CAC]/25';
  const defaultText = textColor || 'text-white';

  return (
    <button 
      type={type} 
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98] ${defaultBg} ${defaultText} ${combinedCustomClass}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
