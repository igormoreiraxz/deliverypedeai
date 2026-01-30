
import React from 'react';

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
    variant?: 'light' | 'dark';
}

const NavButton: React.FC<NavButtonProps> = ({
    icon,
    label,
    active = false,
    onClick,
    variant = 'light'
}) => {
    const baseClasses = "flex flex-col items-center transition-all group relative py-2 px-1";
    const activeClasses = active ? "scale-110" : "hover:scale-105 active:scale-95";

    const textClasses = variant === 'light'
        ? (active ? "text-red-600" : "text-gray-300 group-hover:text-gray-500")
        : (active ? "text-red-500" : "text-gray-500 group-hover:text-gray-300");

    const iconWrapperClasses = active
        ? variant === 'light'
            ? "bg-red-50 shadow-inner shadow-red-100 p-2 rounded-2xl"
            : "bg-red-500/10 shadow-[0_4px_15px_rgba(239,68,68,0.2)] p-2 rounded-2xl"
        : "p-2 rounded-2xl";

    return (
        <button onClick={onClick} className={`${baseClasses} ${activeClasses} ${textClasses}`}>
            <div className={`${iconWrapperClasses} transition-all duration-300`}>
                {React.cloneElement(icon as React.ReactElement, {
                    size: 22,
                    className: active ? "stroke-[2.5px]" : "stroke-2"
                })}
            </div>
            <span className="text-[10px] font-black mt-1.5 uppercase tracking-tighter">
                {label}
            </span>
            {active && (
                <div className="absolute -bottom-1 w-1 h-1 bg-red-600 rounded-full animate-in zoom-in-0 duration-300" />
            )}
        </button>
    );
};

export default NavButton;
