import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Target, Smartphone, CheckCircle2 } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";

// Types
type AuthMode = 'login' | 'signup';
type AuthStep = 'mobile' | 'pin' | 'confirm_pin';

export const LoginScreen = () => {
    const { login, signup, isRememberedUser, rememberedMobile, pendingMobile, clearPendingSession } = useFinance();

    // State - Initialize based on context
    const [mode, setMode] = useState<AuthMode>('login');
    const [step, setStep] = useState<AuthStep>(() => {
        if (isRememberedUser && rememberedMobile) return 'pin';
        return 'mobile';
    });

    // Data State
    const [mobile, setMobile] = useState(() => (isRememberedUser && rememberedMobile) || pendingMobile || "");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    // UI State
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isBiometricActive, setIsBiometricActive] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Biometric Trigger
    useEffect(() => {
        if (isRememberedUser && rememberedMobile) {
            // Optional: Trigger biometrics automatically if desired
            // triggerBiometrics();
        }
    }, [isRememberedUser, rememberedMobile]);

    // Focus Management
    useEffect(() => {
        if (inputRef.current) {
            // Small delay to ensure render is complete before focus
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [step, mode]);

    // Helpers
    const triggerError = React.useCallback(() => {
        setError(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setTimeout(() => setError(false), 500);
        // Clear sensitive fields on error
        if (step === 'pin') setPin("");
        if (step === 'confirm_pin') setConfirmPin("");
    }, [step]);

    const resetState = () => {
        setStep('mobile');
        setPin("");
        setConfirmPin("");
        setError(false);
    };

    // Actions
    const handleNext = async (valueOverride?: string) => {
        if (step === 'mobile') {
            // Validate Mobile
            const val = valueOverride || mobile;
            const cleaned = val.replace(/\D/g, "");
            if (cleaned.length < 10 || cleaned.length > 11) {
                triggerError();
                return;
            }
            setStep('pin');
        } else if (step === 'pin') {
            const val = valueOverride || pin;
            if (val.length !== 4) {
                triggerError();
                return;
            }

            if (mode === 'login') {
                // Perform Login
                setIsLoading(true);
                const success = await login(val, rememberMe);
                setIsLoading(false);
                if (!success) triggerError();
            } else {
                // Signup: Go to Confirm PIN
                setStep('confirm_pin');
            }
        } else if (step === 'confirm_pin') {
            const val = valueOverride || confirmPin;
            if (val.length !== 4) {
                triggerError();
                return;
            }
            const originalPin = pin; // This is fine as pin is stable from prev step
            if (val !== originalPin) {
                triggerError();
                return;
            }

            // Perform Signup
            setIsLoading(true);
            // Use mobile as name for now, or could add a name step later
            const success = await signup(mobile, originalPin, mobile, rememberMe);
            setIsLoading(false);
            if (!success) triggerError();
        }
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

            // Demo biometric bypass
            const loginSuccess = await login("2255", true);
            if (!loginSuccess) setIsBiometricActive(false);
        } catch (err) {
            console.error('Biometric error:', err);
            setIsBiometricActive(false);
        }
    };

    // Mode Switching
    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        resetState();
        // Clear mobile if switching to signup to avoid confusion, or keep it?
        // User asked: "Sign up screen must show login options"
        // Let's keep mobile if it's there to be nice, unless it was remembered login
        if (isRememberedUser && newMode === 'signup') {
            setMobile("");
        }
    };

    const handleBack = () => {
        if (step === 'confirm_pin') setStep('pin');
        else if (step === 'pin') {
            if (isRememberedUser && mode === 'login') {
                // allow clearing remembered user?
                clearPendingSession();
                setMobile("");
            }
            setStep('mobile');
        }
    };

    // Render Helpers
    const getHeader = () => {
        if (mode === 'login') return { title: "Welcome Back", subtitle: "Login to your account" };
        return { title: "Create Account", subtitle: "Join FinHub today" };
    };

    const getInstruction = () => {
        if (step === 'mobile') return "Enter your mobile number";
        if (step === 'pin') return mode === 'login' ? "Enter your 4-digit PIN" : "Create a 4-digit PIN";
        if (step === 'confirm_pin') return "Confirm your PIN";
        return "";
    };

    const isDisabled = () => {
        if (step === 'mobile') return mobile.length < 10 || mobile.length > 11;
        if (step === 'pin') return pin.length !== 4;
        if (step === 'confirm_pin') return confirmPin.length !== 4;
        return false;
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden font-sans bg-[#000000] text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-[url('/mesh-grid.svg')] opacity-20" />
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />

            {/* Header / Logo */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-12 z-10 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <span className="font-bold text-white text-lg">F</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">FinHub</span>
                </div>
            </motion.div>

            {/* Main Card */}
            <div className="z-10 w-full max-w-sm px-6 relative">
                {/* Back Button */}
                {step !== 'mobile' && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        onClick={handleBack}
                        className="absolute -top-12 left-6 text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step + mode}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: error ? [0, -10, 10, -10, 10, 0] : 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col gap-8"
                    >
                        {/* Text Header */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {getHeader().title}
                            </h2>
                            <p className="text-white/40 text-sm font-medium">
                                {getInstruction()}
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 ring-1 ring-white/10 shadow-2xl">

                            {/* Mobile Input */}
                            {step === 'mobile' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 ring-1 ring-white/5 focus-within:ring-sky-500/50 transition-all">
                                        <Smartphone className="w-5 h-5 text-white/40" />
                                        <div className="flex-1">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                inputMode="numeric"
                                                value={mobile}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    if (val.length <= 11) setMobile(val);
                                                }}
                                                className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-white/20"
                                                placeholder="Mobile Number"
                                            />
                                        </div>
                                    </div>

                                    {/* Remember Me Checkbox */}
                                    <div
                                        onClick={() => setRememberMe(!rememberMe)}
                                        className="flex items-center gap-3 cursor-pointer select-none px-2"
                                    >
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${rememberMe ? 'bg-sky-500 border-sky-500' : 'border-white/20 bg-white/5'}`}>
                                            {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-sm text-white/50">Remember me</span>
                                    </div>
                                </div>
                            )}

                            {/* PIN Input */}
                            {(step === 'pin' || step === 'confirm_pin') && (
                                <div className="flex flex-col items-center gap-6">
                                    {/* PIN Circles */}
                                    <div className="flex gap-4">
                                        {[0, 1, 2, 3].map((i) => {
                                            const val = step === 'pin' ? pin : confirmPin;
                                            const filled = i < val.length;
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
                                        value={step === 'pin' ? pin : confirmPin}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (step === 'pin') {
                                                setPin(val);
                                                if (val.length === 4) handleNext(); // Auto submit? Maybe distinct action is better for UX or check debounce
                                            } else {
                                                setConfirmPin(val);
                                                if (val.length === 4) handleNext();
                                            }
                                        }}
                                        className="absolute opacity-0 inset-0 h-full cursor-pointer"
                                        aria-label={step === 'pin' ? "Enter PIN" : "Confirm PIN"}
                                    />

                                    {/* Biometric Button (Only Login + PIN step) */}
                                    {mode === 'login' && step === 'pin' && (
                                        <button onClick={triggerBiometrics} className="flex items-center gap-2 text-sky-400 text-sm font-medium hover:text-sky-300 transition-colors">
                                            <Target className="w-4 h-4" /> Use FaceID / TouchID
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={() => handleNext()}
                            disabled={isDisabled() || isLoading}
                            className={`w-full py-4 rounded-[20px] font-bold text-lg shadow-xl shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-2
                                ${isDisabled() ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-sky-500/40'}
                            `}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {step === 'confirm_pin' ? 'Create Account' : mode === 'login' && step === 'pin' ? 'Login' : 'Continue'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.div>
                </AnimatePresence>

                {/* Footer Mode Switch */}
                <div className="mt-8 text-center space-y-4">
                    {mode === 'login' ? (
                        <p className="text-white/40 text-sm">
                            New to FinHub? {' '}
                            <button onClick={() => switchMode('signup')} className="text-sky-400 font-bold hover:text-sky-300 hover:underline transition-all">
                                Create Account
                            </button>
                        </p>
                    ) : (
                        <p className="text-white/40 text-sm">
                            Already have an account? {' '}
                            <button onClick={() => switchMode('login')} className="text-sky-400 font-bold hover:text-sky-300 hover:underline transition-all">
                                Login Here
                            </button>
                        </p>
                    )}
                </div>
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
