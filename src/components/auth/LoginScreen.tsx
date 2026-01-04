import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Target, CheckCircle2 } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

export const LoginScreen = () => {
    const { checkIdentity, login, isRememberedUser, rememberedMobile } = useFinance();
    const [phase, setPhase] = useState<"identity" | "verify" | "create">("identity");
    const [mobile, setMobile] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showSmartPrompt, setShowSmartPrompt] = useState(false);
    const [isBiometricActive, setIsBiometricActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRememberedUser && rememberedMobile) {
            setMobile(rememberedMobile);
            setPhase("verify");
            // Auto-trigger biometrics if remembered
            triggerBiometrics();
        }
    }, [isRememberedUser, rememberedMobile]);

    const triggerBiometrics = async () => {
        setIsBiometricActive(true);
        // Simulate biometric scan
        setTimeout(async () => {
            // In a real app, we'd call navigator.credentials.get()
            // Here we just simulate success with a 80% probability for the demo
            const success = Math.random() > 0.2;
            if (success) {
                // For demo, we auto-fill PIN if biometric "succeeds" 
                // In reality, biometric would return a token
                // Let's just say for demo that if biometric wins, we log in
                const loginSuccess = await login("2255", true); // Using demo PIN for biometric success
                if (!loginSuccess) {
                    setIsBiometricActive(false);
                }
            } else {
                setIsBiometricActive(false);
                if (navigator.vibrate) navigator.vibrate([50, 50]);
            }
        }, 1500);
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, [phase]);

    const handleMobileSubmit = async () => {
        if (mobile.length !== 10) return;

        // Check identity via context
        const exists = await checkIdentity(mobile);

        if (exists) {
            setPhase("verify");
        } else {
            setPhase("create");
        }
        setPin("");
    };

    const handlePinSubmit = async () => {
        if (phase === "verify") {
            const success = await login(pin, rememberMe);
            if (success) {
                if (navigator.vibrate) navigator.vibrate([10]); // Haptic pop
                if (!rememberMe && !isRememberedUser) {
                    setShowSmartPrompt(true);
                }
            } else {
                triggerError();
            }
        } else if (phase === "create") {
            // Logic for creating new user would go here
            // For now just simulate success if pins match (implied flow need confirm)
            // This simple version just accepts the PIN for new users for demo
            if (pin.length === 4) {
                const success = await login(pin, rememberMe);
                if (!success) triggerError();
            }
        }
    };

    const triggerError = () => {
        setError(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]); // Heavy haptic
        setTimeout(() => setError(false), 500);
        setPin("");
    };

    const isButtonDisabled = () => {
        if (phase === "identity") return mobile.length !== 10;
        if (phase === "verify" || phase === "create") return pin.length !== 4;
        return false;
    };

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden font-sans auth-mesh-gradient"
        >
            {/* Background Mesh Effect */}
            <div className="absolute inset-0 z-0 bg-[url('/mesh-grid.svg')] opacity-20" />

            {/* Header */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-12 z-10"
            >
                <h1 className="text-xl font-bold tracking-tight text-white/90">
                    FinHub Beta
                </h1>
            </motion.div>

            {/* Main Content Stack */}
            <div className="z-10 w-full max-w-sm px-8">
                <AnimatePresence mode="wait">
                    {phase === "identity" && (
                        <motion.div
                            key="identity"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-white">Welcome</h2>
                                <p className="text-white/50 text-sm mt-2">Enter your mobile number to continue</p>
                            </div>

                            <div className="group relative rounded-2xl bg-[#1C1C1E] p-4 ring-1 ring-white/10 transition-all focus-within:ring-sky-500/50">
                                <label className="text-xs font-medium uppercase tracking-wider text-white/40">
                                    Mobile Number
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                                    className="mt-1 w-full bg-transparent text-xl font-medium text-white placeholder-white/20 outline-none"
                                    placeholder="999 999 9999"
                                />
                            </div>

                            {/* Remember Me Toggle */}
                            <div
                                onClick={() => {
                                    setRememberMe(!rememberMe);
                                    if (navigator.vibrate) navigator.vibrate(5);
                                }}
                                className="flex items-center gap-3 cursor-pointer self-center"
                            >
                                <div className={`h-5 w-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? 'bg-sky-500 border-sky-500' : 'border-white/20 bg-white/5'}`}>
                                    {rememberMe && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <span className="text-sm text-white/60 font-medium">Remember me for 30 days</span>
                            </div>
                        </motion.div>
                    )}

                    {(phase === "verify" || phase === "create") && (
                        <motion.div
                            key="verify-create"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: error ? [0, -10, 10, -10, 10, 0] : 0 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="relative flex flex-col gap-8 items-center"
                        >
                            {/* Dark Overlay "Private Mode" Background */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="fixed inset-0 z-[-1] bg-black/80 backdrop-blur-xl"
                            />

                            <div className="text-center">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-4 flex justify-center"
                                >
                                    <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10">
                                        <Shield className="h-8 w-8 text-sky-400" />
                                    </div>
                                </motion.div>
                                <h2 className="text-2xl font-semibold text-white">
                                    {phase === "verify" ? "Private Access" : "Secure Setup"}
                                </h2>
                                <p className="text-white/40 text-sm mt-2">
                                    {phase === "verify" ? "Encrypted PIN required" : "Create your master PIN"}
                                </p>
                            </div>

                            <div className="group relative flex flex-col items-center justify-center rounded-[32px] bg-white/5 p-10 ring-1 ring-white/10 backdrop-blur-md">
                                <div className="flex gap-5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                scale: i < pin.length ? 1.2 : 1,
                                                backgroundColor: i < pin.length ? "#fff" : "rgba(255,255,255,0.1)"
                                            }}
                                            className="h-3.5 w-3.5 rounded-full transition-all duration-200"
                                        />
                                    ))}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pin}
                                    aria-label="Enter PIN"
                                    placeholder="PIN"
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        setPin(val);
                                        if (navigator.vibrate) navigator.vibrate(5);
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-default"
                                    autoFocus
                                />
                            </div>

                            {phase === "verify" && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-2 flex items-center gap-2 text-sky-400 text-sm font-medium"
                                    onClick={triggerBiometrics}
                                >
                                    <Target className="h-5 w-5" />
                                    Use Biometrics
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    onClick={phase === "identity" ? handleMobileSubmit : handlePinSubmit}
                    disabled={isButtonDisabled()}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-[22px] py-4 text-base font-semibold text-white shadow-lg transition-all
            ${isButtonDisabled()
                            ? "cursor-not-allowed bg-[#3A3A3C] opacity-50"
                            : "bg-gradient-to-r from-[#0A84FF] to-[#0047AB] shadow-sky-500/20 active:scale-95"
                        }`}
                    whileTap={{ scale: 0.98 }}
                >
                    {phase === "identity" ? "Continue" : phase === "create" ? "Create Account" : "Login"}
                    {!isButtonDisabled() && <ArrowRight className="h-4 w-4" />}
                </motion.button>
            </div>

            {/* Smart Prompt Overlay */}
            <AnimatePresence>
                {showSmartPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-6 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="w-full max-w-sm rounded-[32px] bg-[#1C1C1E] p-8 text-center ring-1 ring-white/10 shadow-2xl"
                        >
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Speed up your next login?</h3>
                            <p className="mt-2 text-sm text-white/50">
                                We can securely remember your ID so you can skip the mobile entry next time.
                            </p>
                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    onClick={async () => {
                                        // Update preference and proceed
                                        // Login was already successful, so we just persist now
                                        localStorage.setItem('finbase_remembered_mobile', mobile);
                                        setShowSmartPrompt(false);
                                        // Wait a moment before let App.tsx take over?
                                        // Actually App.tsx is already watching authStatus, so we might miss the view
                                        // But authStatus is already 'authenticated'.
                                    }}
                                    className="w-full rounded-2xl bg-sky-500 py-4 font-semibold text-white active:scale-95 transition-all"
                                >
                                    Enable Smart Login
                                </button>
                                <button
                                    onClick={() => setShowSmartPrompt(false)}
                                    className="w-full py-2 text-sm font-medium text-white/30 active:text-white/50"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Biometric Scanning Animation Overlay */}
            <AnimatePresence>
                {isBiometricActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.6, 0.3]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full bg-sky-500/30 blur-2xl"
                                />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20">
                                    <Target className="h-12 w-12 text-sky-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-white">Scanning Biometrics</h3>
                            <p className="mt-2 text-sm text-white/40 italic">Verifying your node identity...</p>

                            <button
                                onClick={() => setIsBiometricActive(false)}
                                className="mt-12 text-xs font-medium uppercase tracking-widest text-white/20 hover:text-white/40"
                            >
                                Cancel & use PIN
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="absolute bottom-8 text-center text-[10px] text-white/20">
                <p>Protected by FinHub Node Protocols. Data is localized and encrypted.</p>
            </div>
        </div>
    );
};
