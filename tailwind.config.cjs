/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Core Surfaces
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'surface-card': 'var(--surface-card)',
                'surface-elevated': 'var(--surface-elevated)',

                // Text
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',
                'text-inverse': 'var(--text-inverse)',

                // Financial Semantics
                'money-positive': 'var(--money-positive)',
                'money-negative': 'var(--money-negative)',
                'money-warning': 'var(--money-warning)',
                'money-neutral': 'var(--money-neutral)',

                // Accents
                'accent-primary': 'var(--accent-primary)',
                'accent-secondary': 'var(--accent-secondary)',
                'accent-ai': 'var(--accent-ai)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
            },
            fontSize: {
                hero: 'var(--text-hero)',
                title: 'var(--text-title)',
                body: 'var(--text-body)',
                caption: 'var(--text-caption)',
            },
            borderRadius: {
                card: 'var(--radius-card)',
                button: 'var(--radius-button)',
                chip: 'var(--radius-chip)',
            },
            spacing: {
                xs: 'var(--space-xs)',
                sm: 'var(--space-sm)',
                md: 'var(--space-md)',
                lg: 'var(--space-lg)',
            }
        },
    },
    plugins: [
        require("tailwindcss-animate")
    ],
}
