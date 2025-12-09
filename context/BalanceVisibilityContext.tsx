import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BalanceVisibilityContextType {
    isHidden: boolean
    toggleVisibility: () => void
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextType | undefined>(undefined)

export const BalanceVisibilityProvider = ({ children }: { children: ReactNode }) => {
    const [isHidden, setIsHidden] = useState(false)

    const toggleVisibility = () => {
        setIsHidden(prev => !prev)
    }

    return (
        <BalanceVisibilityContext.Provider value={{ isHidden, toggleVisibility }}>
            {children}
        </BalanceVisibilityContext.Provider>
    )
}

export const useBalanceVisibility = () => {
    const context = useContext(BalanceVisibilityContext)
    if (!context) {
        throw new Error('useBalanceVisibility must be used within a BalanceVisibilityProvider')
    }
    return context
}
