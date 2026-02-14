import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [type, setType] = useState('full'); // 'full' or 'mini' (for mobile/tablet)

    const toggleSidebar = () => {
        setIsOpen(prev => !prev);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const openSidebar = () => {
        setIsOpen(true);
    };

    return (
        <SidebarContext.Provider value={{ 
            isOpen, 
            toggleSidebar, 
            closeSidebar, 
            openSidebar,
            type,
            setType
        }}>
            {children}
        </SidebarContext.Provider>
    );
};
