import React, { useId } from 'react';

const Select = ({
    options = [],
    label,
    className = '',
    ...props
}, ref) => {
    const id = useId();
    return (
        <div className='w-full'>
            {label && (
                <label htmlFor={id} className='inline-block mb-1.5 text-sm font-semibold text-slate-700'>
                    {label}
                </label>
            )}
            <div className="relative">
                <select 
                    {...props}
                    ref={ref}   
                    id={id}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer shadow-xs ${className}`}
                >
                    {options?.map((option) => ( 
                        <option key={option} value={option} className="capitalize">
                            {option}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default React.forwardRef(Select);