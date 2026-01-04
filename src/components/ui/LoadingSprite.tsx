import { motion } from "framer-motion";
import { Target, Shield } from "lucide-react";

export const LoadingSprite = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000] overflow-hidden">
            {/* Ambient Background Glow */}
            <motion.div
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]"
            />

            <div className="relative flex flex-col items-center justify-center gap-12">
                {/* Pulsing Central Sprite */}
                <div className="relative flex items-center justify-center">
                    {/* Ring Pulsing around Logo */}
                    {[0, 1].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full border border-sky-400/40"
                            initial={{ width: 80, height: 80, opacity: 0.6 }}
                            animate={{
                                width: [80, 200],
                                height: [80, 200],
                                opacity: [0.6, 0],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                delay: i * 1.25,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                "0 0 20px rgba(10, 132, 255, 0.2)",
                                "0 0 40px rgba(10, 132, 255, 0.4)",
                                "0 0 20px rgba(10, 132, 255, 0.2)",
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0B] ring-1 ring-white/10 shadow-2xl"
                    >
                        <Target className="h-10 w-10 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    </motion.div>
                </div>

                {/* Identity Tag */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 ring-1 ring-white/5 backdrop-blur-md">
                        <Shield className="h-3 w-3 text-sky-400" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                            Secure Node Handshake
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Progress Indicator */}
            <div className="absolute bottom-16 w-full max-w-[200px] px-6">
                <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-sky-400 to-transparent"
                    />
                </div>
                <div className="mt-3 text-center">
                    <span className="text-[10px] font-medium text-white/20 italic tracking-wider">
                        Re-encrypting local session...
                    </span>
                </div>
            </div>
        </div>
    );
};
