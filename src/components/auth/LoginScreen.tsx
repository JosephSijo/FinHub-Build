import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Target } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";





export const LoginScreen = () => {
    const { login, setPendingMobile, pendingMobile } = useFinance();

    // Default User Configuration
    const DEFAULT_USER_MOBILE = "9447147230";

    // Set pending mobile immediately on mount, but only if changed
    useEffect(() => {
        if (pendingMobile !== DEFAULT_USER_MOBILE) {
            setPendingMobile(DEFAULT_USER_MOBILE);
        }
    }, [pendingMobile, setPendingMobile]);

    // Data State
    const [pin, setPin] = useState("");

    // UI State
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricActive, setIsBiometricActive] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Focus Management
    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, []);

    // Helpers
    const triggerError = React.useCallback(() => {
        setError(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setTimeout(() => setError(false), 500);
        setPin("");
    }, []);

    // Actions
    const handleNext = async (valueOverride?: string) => {
        const val = valueOverride || pin;
        if (val.length !== 4) {
            triggerError();
            return;
        }

        setIsLoading(true);
        // Always pass true for rememberMe in this single-user mode
        const success = await login(val, true);
        setIsLoading(false);
        if (!success) triggerError();
    };

    // Biometrics
    const triggerBiometrics = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const result = await NativeBiometric.isAvailable();
            if (!result.isAvailable) return;

            setIsBiometricActive(true);
            await NativeBiometric.verifyIdentity({
                reason: "Login to access your secure account",
                title: "Login to FinHub",
                subtitle: "Use biometrics to login",
                description: "Touch the sensor to verify identity",
                negativeButtonText: "Cancel",
            });

            // For now, we still need the PIN for the actual login call in this architecture
            // In a real app, you'd have a token stored in secure storage unlocked by biometrics
            // Here we simulated it in the previous code with a bypass.
            // Let's assume for this specific user flow we might not have the PIN if they just used faceID.
            // But since the user asked for "2255" as PIN, we can hardcode the bypass if biometric succeeds.

            const loginSuccess = await login("2255", true);
            if (!loginSuccess) setIsBiometricActive(false);
        } catch (err) {
            console.error('Biometric error:', err);
            setIsBiometricActive(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden font-sans bg-[#000000] text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-[url('/mesh-grid.svg')] opacity-20" />
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />

            {/* Main Card */}
            <div className="z-10 w-full max-w-sm px-6 relative flex flex-col items-center gap-12">

                {/* FAB-style Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative group"
                >
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent opacity-50" />
                        <img
                            src="/images/logo-icon.png"
                            alt="FinHub"
                            className="w-12 h-12 object-contain relative z-10 drop-shadow-2xl"
                        />
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, x: error ? [0, -10, 10, -10, 10, 0] : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col gap-8 w-full"
                    >
                        {/* Text Header */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="text-white/40 text-sm font-medium">
                                Enter your 4-digit PIN
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 ring-1 ring-white/10 shadow-2xl">
                            <div className="flex flex-col items-center gap-6">
                                {/* PIN Circles */}
                                <div className="flex gap-4">
                                    {[0, 1, 2, 3].map((i) => {
                                        const filled = i < pin.length;
                                        return (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    scale: filled ? 1 : 0.8,
                                                    backgroundColor: filled ? "#fff" : "rgba(255,255,255,0.1)",
                                                    boxShadow: filled ? "0 0 20px rgba(255,255,255,0.3)" : "none"
                                                }}
                                                className="w-4 h-4 rounded-full"
                                            />
                                        );
                                    })}
                                </div>

                                {/* Visible (Hidden) Input */}
                                <input
                                    ref={inputRef}
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        setPin(val);
                                        if (val.length === 4) handleNext(val);
                                    }}
                                    className="absolute opacity-0 inset-0 h-full cursor-pointer"
                                    aria-label="Enter PIN"
                                />

                                {/* Biometric Button */}
                                <button onClick={triggerBiometrics} className="flex items-center gap-2 text-sky-400 text-sm font-medium hover:text-sky-300 transition-colors">
                                    <Target className="w-4 h-4" /> Use FaceID
                                </button>
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={() => handleNext()}
                            disabled={pin.length !== 4 || isLoading}
                            className={`w-full py-4 rounded-[20px] font-bold text-lg shadow-xl shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-2
                                ${pin.length !== 4 ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-sky-500/40'}
                            `}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Login
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Biometric Overlay */}
            <AnimatePresence>
                {isBiometricActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
                        <div className="relative">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full bg-sky-500/30 blur-2xl" />
                            <Target className="w-20 h-20 text-sky-400 relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mt-8">Verifying Identity</h3>
                        <p className="text-white/40 mt-2">Please authenticate to continue</p>
                        <button onClick={() => setIsBiometricActive(false)} className="mt-8 px-6 py-2 rounded-full border border-white/10 text-white/40 hover:text-white transition-colors text-sm uppercase tracking-wider">
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
