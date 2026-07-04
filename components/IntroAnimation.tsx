import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

const IntroAnimation: React.FC<Props> = ({ onComplete }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onComplete, 1000); // Wait for exit animation
        }, 5500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
                >
                    {/* Background Effects */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-black via-black to-primary/20"
                        animate={{
                            background: [
                                "linear-gradient(to bottom right, #000 0%, #000 50%, #ff5e0033 100%)",
                                "linear-gradient(to bottom right, #ff5e0033 0%, #000 50%, #000 100%)",
                                "linear-gradient(to bottom right, #000 0%, #000 50%, #ff5e0033 100%)"
                            ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Particles/Noise Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="mb-6 relative"
                        >
                            {/* Glowing Text Effect */}
                            <motion.h1
                                className="text-4xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white uppercase tracking-tighter text-center px-4"
                                animate={{
                                    textShadow: [
                                        "0 0 10px rgba(255,94,0,0.5)",
                                        "0 0 20px rgba(255,94,0,0.8)",
                                        "0 0 10px rgba(255,94,0,0.5)"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                NEEYUM AGALAM DAA
                            </motion.h1>

                            <motion.h1
                                className="text-6xl md:text-9xl font-display font-bold text-primary uppercase tracking-tighter text-center mt-2"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1 }}
                            >
                                LEODAS
                            </motion.h1>
                        </motion.div>

                        <motion.div
                            className="h-1 bg-white/20 w-64 rounded-full overflow-hidden mt-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 3.5, ease: "easeInOut", delay: 1.5 }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntroAnimation;
