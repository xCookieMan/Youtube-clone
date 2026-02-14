import React from 'react';

const Input = ({ 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    className = '',
    label,
    error,
    ...props
}) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`bg-[#121212] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors ${className} ${error ? 'border-red-500' : ''}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};

export default Input;
