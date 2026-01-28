# Project Dependencies & Services

A summary of the core technologies and services used in FinHub and why they were chosen.

## ⚛️ Core Frontend
- **React 19**: The foundation of our UI. Chosen for its performance, hooks-based architecture, and robust ecosystem.
- **Vite 7**: Our build tool and development server. It provides lightning-fast HMR (Hot Module Replacement) and optimized production builds.
- **Radix UI**: A collection of high-quality, unstyled accessible UI primitives. We use this for complex components like Dialogs, Popovers, and Tabs to ensure accessibility (a11y) without sacrificing design flexibility.
- **Motion (Framer Motion)**: Used for high-performance fluid animations and layout transitions that give FinHub its premium feel.
- **Recharts**: A composable charting library used to visualize financial data, growth horizons, and spending trends.

## 📱 Mobile & Native (Capacitor)
- **Capacitor 8**: The bridge between our web code and native mobile features.
- **Biometric (@capgo/capacitor-native-biometric)**: Enables FaceID/TouchID authentication for secure app access.
- **Local Notifications**: Used to alert users about upcoming bills or budget limits without needing a complex backend push service.
- **Contacts**: Allows users to easily add friends for IOU tracking.

## 🎨 Styling & Icons
- **Tailwind CSS 4**: A utility-first CSS framework. Used to build a custom, responsive design system quickly and consistently.
- **Lucide React**: A beautiful and consistent icon library used throughout the application.

## ☁️ Backend & AI
- **Supabase**: Our primary backend service (BaaS).
  - **Auth**: Manages user sign-ups and secure sessions.
  - **Database (Postgres)**: Stores all financial records with high integrity.
  - **Edge Functions (Deno/Hono)**: Serverless functions used for our AI logic and secure proxying.
- **Gemini API (Google)**: The "brain" behind FinHub. Used for smart transaction categorization, financial insights, and the AI Guru chat.
- **Hono**: A small, fast web framework used inside Supabase Edge Functions to handle incoming AI requests.

## 🛠️ Utilities
- **Zod**: A TypeScript-first schema validation library. We use it to ensure that data coming from API requests or forms matches our expected format.
- **Sonner**: A clean, accessible toast notification library for status feedback (e.g., "Transaction Saved").
- **Canvas Confetti**: Used for micro-interactions to celebrate financial milestones (e.g., "Debt Paid Off!").
- **React Hook Form**: Manages complex form states and validation with high performance.
