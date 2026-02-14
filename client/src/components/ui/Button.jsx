import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    className = '',
    disabled = false
}) => {
    const baseStyles = "px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-[#3ea6ff] text-black hover:bg-[#65b8ff]",
        secondary: "bg-[#272727] text-white hover:bg-[#3f3f3f]",
        outline: "border border-gray-600 text-[#3ea6ff] hover:bg-[#263850]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        ghost: "hover:bg-[#272727] text-white"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
