import React, { createContext, useContext, useState } from 'react'

interface SidebarContextType {
    isSidebarVisible: boolean
    openSidebar: () => void
    closeSidebar: () => void
    toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(false)

    const openSidebar = () => setIsSidebarVisible(true)
    const closeSidebar = () => setIsSidebarVisible(false)
    const toggleSidebar = () => setIsSidebarVisible(prev => !prev)

    return (
        <SidebarContext.Provider
            value={{
                isSidebarVisible,
                openSidebar,
                closeSidebar,
                toggleSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
