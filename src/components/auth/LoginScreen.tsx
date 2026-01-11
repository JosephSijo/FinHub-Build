import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Target, CheckCircle2, MessageSquare, KeyRound } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

type AuthPhase = "identity" | "verify" | "otp_verify" | "create_name" | "create_pin" | "otp_reset" | "reset_pin";

export const LoginScreen = () => {
    const { checkIdentity, login, signup, sendOtp, verifyOtp, resetPin, isRememberedUser, rememberedMobile, pendingMobile, clearPendingSession } = useFinance();
    const [phase, setPhase] = useState<AuthPhase>("identity");
    const [mobile, setMobile] = useState("");
    const [pin, setPin] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const [error, setError] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showSmartPrompt, setShowSmartPrompt] = useState(false);
    const [isBiometricActive, setIsBiometricActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRememberedUser && rememberedMobile) {
            setMobile(rememberedMobile);
            setPhase("verify");
            triggerBiometrics();
        } else if (pendingMobile) {
            setMobile(pendingMobile);
            setPhase("verify");
        }
    }, [isRememberedUser, rememberedMobile, pendingMobile]);

    const triggerBiometrics = async () => {
        setIsBiometricActive(true);
        setTimeout(async () => {
            const success = Math.random() > 0.2;
            if (success) {
                const loginSuccess = await login("2255", true);
                if (!loginSuccess) {
                    setIsBiometricActive(false);
                }
            } else {
                setIsBiometricActive(false);
                if (navigator.vibrate) navigator.vibrate([50, 50]);
            }
        }, 1500);
    };



    // Auto-proceed logic
    useEffect(() => {
        if (phase === "identity" && mobile.length === 10) {
            handleMobileSubmit();
        }
    }, [mobile, phase]);

    useEffect(() => {
        if (phase === "verify" && pin.length === 4) {
            handlePinSubmit();
        }
    }, [pin, phase]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current.type !== "hidden") {
                inputRef.current.select();
            }
        }
    }, [phase]);

    const handleMobileSubmit = async () => {
        if (mobile.length !== 10) return;
        const exists = await checkIdentity(mobile);
        if (exists) {
            setPhase("verify");
        } else {
            setPhase("create_name");
        }
        setPin("");
    };

    const handleForgotPin = async () => {
        const success = await sendOtp(mobile);
        if (success) {
            setPhase("otp_reset");
        }
    };

    const handleNameSubmit = async () => {
        if (name.trim().length < 2) return;
        const success = await sendOtp(mobile);
        if (success) {
            setPhase("otp_verify");
        }
    };

    const handleOtpSubmit = async () => {
        const success = await verifyOtp(mobile, otp);
        if (success) {
            if (phase === "otp_verify") {
                setPhase("create_pin");
            } else {
                setPhase("reset_pin");
            }
        } else {
            triggerError();
        }
    };

    const handlePinSubmit = async () => {
        if (phase === "verify") {
            const success = await login(pin, rememberMe);
            if (success) {
                if (navigator.vibrate) navigator.vibrate([10]);
                if (!rememberMe && !isRememberedUser) {
                    setShowSmartPrompt(true);
                }
            } else {
                triggerError();
            }
        } else if (phase === "create_pin") {
            if (pin.length === 4) {
                const success = await signup(mobile, pin, name, rememberMe);
                if (!success) triggerError();
            }
        } else if (phase === "reset_pin") {
            if (newPin === confirmPin && newPin.length === 4) {
                const success = await resetPin(mobile, newPin);
                if (success) {
                    setPhase("verify");
                    setPin("");
                    setNewPin("");
                    setConfirmPin("");
                } else {
                    triggerError();
                }
            } else {
                triggerError();
            }
        }
    };

    const triggerError = () => {
        setError(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setTimeout(() => setError(false), 500);
        setOtp("");
        setPin("");
        setConfirmPin("");
    };

    const isButtonDisabled = () => {
        if (phase === "identity") return mobile.length !== 10;
        if (phase === "verify") return pin.length !== 4;
        if (phase === "otp_verify" || phase === "otp_reset") return otp.length !== 4;
        if (phase === "create_name") return name.trim().length < 2;
        if (phase === "create_pin") return pin.length !== 4;
        if (phase === "reset_pin") return newPin.length !== 4 || confirmPin.length !== 4;
        return false;
    };

    const handleSwitchAccount = () => {
        clearPendingSession();
        setPhase("identity");
        setMobile("");
        setPin("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isButtonDisabled()) {
            getPrimaryAction()();
        }
    };

    const getPrimaryAction = () => {
        switch (phase) {
            case "identity": return handleMobileSubmit;
            case "otp_verify":
            case "otp_reset": return handleOtpSubmit;
            case "create_name": return handleNameSubmit;
            case "verify":
            case "create_pin":
            case "reset_pin": return handlePinSubmit;
            default: return () => { };
        }
    };

    const getButtonLabel = () => {
        switch (phase) {
            case "identity": return "Continue";
            case "otp_verify":
            case "otp_reset": return "Verify OTP";
            case "create_name": return "Next";
            case "verify": return "Login";
            case "create_pin": return "Create Account";
            case "reset_pin": return "Reset PIN";
            default: return "Continue";
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden font-sans auth-mesh-gradient z-[9999999]">
            <div className="absolute inset-0 z-0 bg-[url('/mesh-grid.svg')] opacity-20" />

            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-12 z-10 flex flex-col items-center gap-2">
                <img src="/images/logo-dark.png" alt="FinHub" className="h-12 w-auto" />
                <span className="text-xs font-medium text-white/40 tracking-widest uppercase">v0.1 Beta</span>
            </motion.div>

            <div className="z-10 w-full max-w-sm px-8">
                <AnimatePresence mode="wait">
                    {phase === "identity" && (
                        <motion.div key="identity" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-white">Welcome</h2>
                                <p className="text-white/50 text-sm mt-2">Enter your mobile number to continue</p>
                            </div>
                            <div className="group relative rounded-2xl bg-[#1C1C1E] p-4 ring-1 ring-white/10 transition-all focus-within:ring-sky-500/50">
                                <label className="text-xs font-medium uppercase tracking-wider text-white/40">Mobile Number</label>
                                <input ref={inputRef} type="text" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} onKeyDown={handleKeyDown} className="mt-1 w-full bg-transparent text-xl font-medium text-white placeholder-white/20 outline-none" placeholder="999 999 9999" />
                            </div>
                            <div onClick={() => { setRememberMe(!rememberMe); if (navigator.vibrate) navigator.vibrate(5); }} className="flex items-center gap-3 cursor-pointer self-center">
                                <div className={`h-5 w-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? 'bg-sky-500 border-sky-500' : 'border-white/20 bg-white/5'}`}>
                                    {rememberMe && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <span className="text-sm text-white/60 font-medium">Remember me for 30 days</span>
                            </div>
                        </motion.div>
                    )}

                    {phase === "create_name" && (
                        <motion.div key="create_name" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col gap-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-white">Who are you?</h2>
                                <p className="text-white/50 text-sm mt-2">Personalize your node experience</p>
                            </div>
                            <div className="group relative rounded-2xl bg-[#1C1C1E] p-4 ring-1 ring-white/10 transition-all focus-within:ring-sky-500/50">
                                <label className="text-xs font-medium uppercase tracking-wider text-white/40">Full Name</label>
                                <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} className="mt-1 w-full bg-transparent text-xl font-medium text-white placeholder-white/20 outline-none" placeholder="Joe Doe" />
                            </div>
                        </motion.div>
                    )}

                    {(phase === "otp_verify" || phase === "otp_reset") && (
                        <motion.div key="otp" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: error ? [0, -10, 10, -10, 10, 0] : 0 }} exit={{ scale: 1.1, opacity: 0 }} className="relative flex flex-col gap-8 items-center">
                            <div className="text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10">
                                        <MessageSquare className="h-8 w-8 text-sky-400" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-semibold text-white">Verify Node</h2>
                                <p className="text-white/40 text-sm mt-2">Enter the 4-digit code sent to<br /><span className="text-white/70">{mobile}</span></p>
                            </div>
                            <div className="group relative flex flex-col items-center justify-center rounded-[32px] bg-white/5 p-10 ring-1 ring-white/10 backdrop-blur-md">
                                <div className="flex gap-5">
                                    {/* Removing transition-all duration-200 to fix lag */}
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div key={i} animate={{ scale: i < otp.length ? 1.2 : 1, backgroundColor: i < otp.length ? "#fff" : "rgba(255,255,255,0.1)" }} transition={{ duration: 0.1 }} className="h-3.5 w-3.5 rounded-full" />
                                    ))}
                                </div>
                                <input ref={inputRef} type="password" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} onKeyDown={handleKeyDown} className="absolute inset-0 opacity-0 cursor-default" aria-label="One-time Password" placeholder="OTP" />
                            </div>
                        </motion.div>
                    )}

                    {phase === "reset_pin" && (
                        <motion.div key="reset_pin" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: error ? [0, -10, 10, -10, 10, 0] : 0 }} exit={{ scale: 1.1, opacity: 0 }} className="relative flex flex-col gap-8 items-center">
                            <div className="text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10">
                                        <KeyRound className="h-8 w-8 text-amber-400" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-semibold text-white">Reset PIN</h2>
                                <p className="text-white/40 text-sm mt-2">Choose a new secure 4-digit access code</p>
                            </div>
                            <div className="space-y-4 w-full">
                                <div className="group relative rounded-2xl bg-[#1C1C1E] p-4 ring-1 ring-white/10 transition-all focus-within:ring-amber-500/50">
                                    <label className="text-xs font-medium uppercase tracking-wider text-white/40">New PIN</label>
                                    <input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} onKeyDown={handleKeyDown} className="mt-1 w-full bg-transparent text-xl font-medium text-white placeholder-white/20 outline-none" placeholder="****" />
                                </div>
                                <div className="group relative rounded-2xl bg-[#1C1C1E] p-4 ring-1 ring-white/10 transition-all focus-within:ring-amber-500/50">
                                    <label className="text-xs font-medium uppercase tracking-wider text-white/40">Confirm PIN</label>
                                    <input type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} onKeyDown={handleKeyDown} className="mt-1 w-full bg-transparent text-xl font-medium text-white placeholder-white/20 outline-none" placeholder="****" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(phase === "verify" || phase === "create_pin") && (
                        <motion.div key="pin" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: error ? [0, -10, 10, -10, 10, 0] : 0 }} exit={{ scale: 1.1, opacity: 0 }} className="relative flex flex-col gap-8 items-center">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[-1] bg-black/80 backdrop-blur-xl" />
                            <div className="text-center">
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4 flex justify-center">
                                    <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10">
                                        <Shield className="h-8 w-8 text-sky-400" />
                                    </div>
                                </motion.div>
                                <h2 className="text-2xl font-semibold text-white">{phase === "verify" ? "Private Access" : "Secure Setup"}</h2>
                                <p className="text-white/40 text-sm mt-2">{phase === "verify" ? "Encrypted PIN required" : "Create your master PIN"}</p>
                            </div>
                            <div className="group relative flex flex-col items-center justify-center rounded-[32px] bg-white/5 p-10 ring-1 ring-white/10 backdrop-blur-md">
                                <div className="flex gap-5">
                                    {/* Removing transition-all duration-200 to fix lag */}
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div key={i} animate={{ scale: i < pin.length ? 1.2 : 1, backgroundColor: i < pin.length ? "#fff" : "rgba(255,255,255,0.1)" }} transition={{ duration: 0.1 }} className="h-3.5 w-3.5 rounded-full" />
                                    ))}
                                </div>
                                <input ref={inputRef} type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={handleKeyDown} className="absolute inset-0 opacity-0 cursor-default" aria-label="Access PIN" placeholder="PIN" />
                            </div>
                            {phase === "verify" && (
                                <div className="flex flex-col items-center gap-4">
                                    <button onClick={triggerBiometrics} className="flex items-center gap-2 text-sky-400 text-sm font-medium">
                                        <Target className="h-5 w-5" /> Use Biometrics
                                    </button>
                                    <button onClick={handleForgotPin} className="text-white/30 text-xs hover:text-white/50 transition-colors">
                                        Forgot PIN? Reset via SMS
                                    </button>
                                    <button onClick={handleSwitchAccount} className="text-sky-500/50 text-[10px] font-bold uppercase tracking-widest hover:text-sky-400/80 transition-colors mt-2">
                                        Login with another account
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button onClick={getPrimaryAction()} disabled={isButtonDisabled()} className={`mt-8 flex w-full items-center justify-center gap-2 rounded-[22px] py-4 text-base font-semibold text-white shadow-lg transition-all ${isButtonDisabled() ? "cursor-not-allowed bg-[#3A3A3C] opacity-50" : "bg-gradient-to-r from-[#0A84FF] to-[#0047AB] shadow-sky-500/20 active:scale-95"}`} whileTap={{ scale: 0.98 }}>
                    {getButtonLabel()}
                    {!isButtonDisabled() && <ArrowRight className="h-4 w-4" />}
                </motion.button>
            </div>

            <AnimatePresence>
                {showSmartPrompt && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-6 backdrop-blur-sm">
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-sm rounded-[32px] bg-[#1C1C1E] p-8 text-center ring-1 ring-white/10 shadow-2xl">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Speed up your next login?</h3>
                            <p className="mt-2 text-sm text-white/50">We can securely remember your ID so you can skip the mobile entry next time.</p>
                            <div className="mt-8 flex flex-col gap-3">
                                <button onClick={() => { localStorage.setItem('finhub_remembered_mobile', mobile); setShowSmartPrompt(false); }} className="w-full rounded-2xl bg-sky-500 py-4 font-semibold text-white active:scale-95 transition-all">Enable Smart Login</button>
                                <button onClick={() => setShowSmartPrompt(false)} className="w-full py-2 text-sm font-medium text-white/30 active:text-white/50">Maybe later</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBiometricActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                            <div className="relative mb-6">
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full bg-sky-500/30 blur-2xl" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20">
                                    <Target className="h-12 w-12 text-sky-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-white">Scanning Biometrics</h3>
                            <p className="mt-2 text-sm text-white/40 italic">Verifying your node identity...</p>
                            <button onClick={() => setIsBiometricActive(false)} className="mt-12 text-xs font-medium uppercase tracking-widest text-white/20 hover:text-white/40">Cancel & use PIN</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-8 text-center text-[10px] text-white/20">
                <p>Protected by FinHub Node Protocols. Data is localized and encrypted.</p>
            </div>
        </div>
    );
};
