const NeuLoader = ({ text = 'Loading…', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'pl--sm',
    md: 'pl--md',
    lg: 'pl--lg',
  };

  const plSizeClass = sizeMap[size] || sizeMap.md;
  const isCustomText = Boolean(text && text.trim() && text !== 'Loading...' && text !== 'Loading…');

  return (
    <div
      className={`neu-loader-wrapper flex flex-col items-center justify-center p-4 ${className}`}
      role="status"
      aria-label={text || 'Loading'}
    >
      <div className={`pl ${plSizeClass}`}>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__dot"></div>
        <div className="pl__text">{text && text.length <= 10 ? text : 'Loading…'}</div>
      </div>
      {isCustomText && (
        <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 text-center animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default NeuLoader;
