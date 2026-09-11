import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export const WatermarkOverlay: React.FC = () => {
  const { userProfile } = useAuth();
  const [position, setPosition] = useState({ top: '10%', left: '10%' });

  useEffect(() => {
    const moveWatermark = () => {
      const top = Math.floor(Math.random() * 70) + 10;
      const left = Math.floor(Math.random() * 70) + 10;
      setPosition({ top: `${top}%`, left: `${left}%` });
    };

    moveWatermark();
    const intervalId = setInterval(moveWatermark, 15000);

    return () => clearInterval(intervalId);
  }, []);

  if (!userProfile) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
      <motion.div
        animate={position}
        transition={{ duration: 15, ease: "linear" }}
        className="absolute text-slate-100/25 whitespace-nowrap text-sm md:text-base font-bold select-none drop-shadow-md mix-blend-overlay flex flex-col items-center rotate-[-15deg]"
      >
        <span>{userProfile.fullName}</span>
        <span dir="ltr" className="font-mono mt-1">{userProfile.phone}</span>
      </motion.div>
    </div>
  );
};
