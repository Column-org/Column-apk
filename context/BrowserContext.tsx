import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PERMISSIONS = 'column_browser_permissions';
const STORAGE_KEY_HISTORY = 'column_browser_history';
const STORAGE_KEY_BOOKMARKS = 'column_browser_bookmarks';

export interface HistoryItem {
    url: string;
    title: string;
    timestamp: number;
}

export interface BookmarkItem {
    url: string;
    title: string;
}

interface BrowserContextType {
    approvedOrigins: Set<string>;
    addApprovedOrigin: (origin: string) => Promise<void>;
    removeApprovedOrigin: (origin: string) => Promise<void>;
    clearAllPermissions: () => Promise<void>;
    history: HistoryItem[];
    addToHistory: (url: string, title?: string) => Promise<void>;
    removeFromHistory: (timestamp: number) => Promise<void>;
    clearHistory: () => Promise<void>;
    bookmarks: BookmarkItem[];
    toggleBookmark: (url: string, title: string) => Promise<void>;
    isBookmarked: (url: string) => boolean;
    isInitialized: boolean;
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined);

export function BrowserProvider({ children }: { children: React.ReactNode }) {
    const [approvedOrigins, setApprovedOrigins] = useState<Set<string>>(new Set());
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load state on mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const storedPermissions = await AsyncStorage.getItem(STORAGE_KEY_PERMISSIONS);
                if (storedPermissions) {
                    setApprovedOrigins(new Set(JSON.parse(storedPermissions)));
                }

                const storedHistory = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
                if (storedHistory) {
                    setHistory(JSON.parse(storedHistory));
                }

                const storedBookmarks = await AsyncStorage.getItem(STORAGE_KEY_BOOKMARKS);
                if (storedBookmarks) {
                    setBookmarks(JSON.parse(storedBookmarks));
                }
            } catch (e) {
                console.error('Failed to load browser state', e);
            } finally {
                setIsInitialized(true);
            }
        };
        loadState();
    }, []);

    const savePermissions = useCallback(async (newSet: Set<string>) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(Array.from(newSet)));
        } catch (e) {
            console.error('Failed to save browser permissions', e);
        }
    }, []);

    const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Failed to save browser history', e);
        }
    }, []);

    const saveBookmarks = useCallback(async (newBookmarks: BookmarkItem[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(newBookmarks));
        } catch (e) {
            console.error('Failed to save browser bookmarks', e);
        }
    }, []);

    const addApprovedOrigin = useCallback(async (origin: string) => {
        setApprovedOrigins(prev => {
            const next = new Set(prev).add(origin);
            savePermissions(next);
            return next;
        });
    }, [savePermissions]);

    const removeApprovedOrigin = useCallback(async (origin: string) => {
        setApprovedOrigins(prev => {
            const next = new Set(prev);
            next.delete(origin);
            savePermissions(next);
            return next;
        });
    }, [savePermissions]);

    const clearAllPermissions = useCallback(async () => {
        const empty = new Set<string>();
        setApprovedOrigins(empty);
        await savePermissions(empty);
    }, [savePermissions]);

    const addToHistory = useCallback(async (url: string, title?: string) => {
        if (!url || url === 'about:blank') return;

        setHistory(prev => {
            // Remove previous instances of same URL to avoid duplicates and move to top
            const filtered = prev.filter(item => item.url !== url);
            const newItem: HistoryItem = {
                url,
                title: title || url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
                timestamp: Date.now()
            };
            const next = [newItem, ...filtered].slice(0, 100); // Keep last 100 items
            saveHistory(next);
            return next;
        });
    }, [saveHistory]);

    const removeFromHistory = useCallback(async (timestamp: number) => {
        setHistory(prev => {
            const next = prev.filter(item => item.timestamp !== timestamp);
            saveHistory(next);
            return next;
        });
    }, [saveHistory]);

    const clearHistory = useCallback(async () => {
        setHistory([]);
        await saveHistory([]);
    }, [saveHistory]);

    const toggleBookmark = useCallback(async (url: string, title: string) => {
        if (!url || url === 'about:blank') return;

        setBookmarks(prev => {
            const exists = prev.find(b => b.url === url);
            let next;
            if (exists) {
                next = prev.filter(b => b.url !== url);
            } else {
                next = [{ url, title: title || url }, ...prev];
            }
            saveBookmarks(next);
            return next;
        });
    }, [saveBookmarks]);

    const isBookmarked = useCallback((url: string) => {
        return bookmarks.some(b => b.url === url);
    }, [bookmarks]);

    return (
        <BrowserContext.Provider value={{
            approvedOrigins,
            addApprovedOrigin,
            removeApprovedOrigin,
            clearAllPermissions,
            history,
            addToHistory,
            removeFromHistory,
            clearHistory,
            bookmarks,
            toggleBookmark,
            isBookmarked,
            isInitialized
        }}>
            {children}
        </BrowserContext.Provider>
    );
}

export function useBrowser() {
    const context = useContext(BrowserContext);
    if (!context) {
        throw new Error('useBrowser must be used within a BrowserProvider');
    }
    return context;
}
