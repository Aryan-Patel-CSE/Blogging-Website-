import React, { useId } from 'react';

const Input = React.forwardRef(function Input({
    label,
    type = "text",
    className = "",
    error,
    ...props
}, ref) {
    const id = useId();
    return (
        <div className="w-full">
            {label && (
                <label 
                    className="inline-block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`neu-input w-full px-4 py-2.5 text-sm transition-all duration-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                    error 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/30' 
                        : ''
                } ${className}`}
                ref={ref}
                {...props}
                id={id}
            />
            {error && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
            )}
        </div>
    );
});

export default Input;