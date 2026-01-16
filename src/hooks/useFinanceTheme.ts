import { useCallback, useMemo } from 'react';

export const useFinanceTheme = () => {
    const applyTheme = useCallback((theme: "light" | "dark" | "system") => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, []);

    return useMemo(() => ({ applyTheme }), [applyTheme]);
};
