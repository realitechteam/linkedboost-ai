/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary - Caffiliate Green
                primary: {
                    50: "#F0FDF4",
                    100: "#DCFCE7",
                    200: "#BBF7D0",
                    300: "#86EFAC",
                    400: "#4ADE80",
                    500: "#22C55E",
                    600: "#16A34A",
                    700: "#15803D",
                    800: "#166534",
                    900: "#14532D",
                },
                // Accent - Caffiliate Orange
                accent: {
                    50: "#FFF7ED",
                    100: "#FFEDD5",
                    200: "#FED7AA",
                    300: "#FDBA74",
                    400: "#FB923C",
                    500: "#F97316",
                    600: "#EA580C",
                    700: "#C2410C",
                    800: "#9A3412",
                    900: "#7C2D12",
                },
                // Light mode backgrounds
                background: {
                    DEFAULT: "#F9FAFB",
                    secondary: "#F3F4F6",
                },
                // Card colors
                card: {
                    DEFAULT: "#FFFFFF",
                    border: "#E5E7EB",
                },
                // Text colors
                foreground: {
                    DEFAULT: "#1F2937",
                    secondary: "#6B7280",
                    muted: "#9CA3AF",
                },
                // Sidebar
                sidebar: {
                    bg: "#FFFFFF",
                    active: "#F0FDF4",
                    border: "#E5E7EB",
                },
            },
            fontFamily: {
                heading: ["Space Grotesk", "sans-serif"],
                body: ["Inter", "sans-serif"],
                sans: ["Inter", "sans-serif"],
            },
            fontSize: {
                h1: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
                h2: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "600" }],
                h3: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
                h4: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
                body: ["1rem", { lineHeight: "1.5rem" }],
                small: ["0.875rem", { lineHeight: "1.25rem" }],
                xs: ["0.75rem", { lineHeight: "1rem" }],
            },
            spacing: {
                xs: "0.25rem",
                sm: "0.5rem",
                md: "1rem",
                lg: "1.5rem",
                xl: "2rem",
                "2xl": "3rem",
                "3xl": "4rem",
            },
            borderRadius: {
                DEFAULT: "0.75rem",
                sm: "0.5rem",
                md: "0.75rem",
                lg: "1rem",
                xl: "1.5rem",
                full: "9999px",
            },
            boxShadow: {
                card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                sidebar: "2px 0 8px 0 rgb(0 0 0 / 0.05)",
            },
            backgroundImage: {
                "gradient-hero": "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FCD34D 100%)",
                "gradient-primary": "linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)",
                "gradient-accent": "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
