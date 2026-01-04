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
                // Quantum Core
                'q-primary': 'var(--q-obsidian)',
                'q-glass': 'var(--q-glass)',
                'q-sapphire': 'var(--q-sapphire)',
                'q-amethyst': 'var(--q-amethyst)',
                'q-emerald': 'var(--q-emerald)',
                'q-ruby': 'var(--q-ruby)',
                'q-gold': 'var(--q-gold)',

                // Legacy Shim
                'bg-primary': 'var(--q-obsidian)',
                'bg-secondary': 'var(--q-obsidian)',
                'text-primary': '#FFFFFF',
                'text-secondary': 'var(--q-slate)',
            },
            fontFamily: {
                sans: ['var(--q-font-ui)', 'Inter', 'Outfit', 'sans-serif'],
                mono: ['var(--q-font-data)', 'JetBrains Mono', 'Roboto Mono', 'monospace'],
            },
            borderRadius: {
                '2xl': 'var(--q-radius-2xl)',
                'xl': 'var(--q-radius-xl)',
                'lg': 'var(--q-radius-lg)',
                'md': 'var(--q-radius-md)',
                'sm': 'var(--q-radius-sm)',
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
