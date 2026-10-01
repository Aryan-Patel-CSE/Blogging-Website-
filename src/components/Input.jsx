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
        <div className='w-full'>
            {label && (
                <label 
                    className='inline-block mb-1.5 text-sm font-semibold text-slate-700'
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm border transition-all duration-200 outline-none placeholder:text-slate-400 ${
                    error 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-100' 
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 shadow-xs'
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