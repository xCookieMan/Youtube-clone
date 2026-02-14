import React from 'react';

const Avatar = ({ src, alt, size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: 'w-8 h-8',
        medium: 'w-10 h-10',
        large: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-700 flex-shrink-0 ${className}`}>
            <img 
                src={src || "https://via.placeholder.com/150"} 
                alt={alt || "Avatar"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150";
                }}
            />
        </div>
    );
};

export default Avatar;
