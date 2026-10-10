import React, { useId } from 'react';

const Select = ({
    options = [],
    label,
    className = '',
    ...props
}, ref) => {
    const id = useId();
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="inline-block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <select 
                    {...props}
                    ref={ref}   
                    id={id}
                    className={`neu-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer pr-10 ${className}`}
                >
                    {options?.map((option) => ( 
                        <option key={option} value={option} className="capitalize bg-[var(--neu-bg)] text-slate-800 dark:text-slate-100">
                            {option}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(Select);