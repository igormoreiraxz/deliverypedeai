
import React from 'react';
import { Zap } from 'lucide-react';

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    showLogo?: boolean;
    variant?: 'light' | 'dark';
    onLogoClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    subtitle,
    rightElement,
    showLogo = true,
    variant = 'light',
    onLogoClick
}) => {
    const bgClasses = variant === 'light' ? "bg-white border-b" : "bg-gray-900 border-b border-gray-800 text-white";
    const titleClasses = variant === 'light' ? "text-gray-900" : "text-white";

    return (
        <header className={`${bgClasses} px-4 lg:px-8 py-5 sticky top-0 z-40 flex justify-between items-center shadow-sm lg:shadow-none transition-all duration-500`}>
            <div className="flex items-center">
                {showLogo && (
                    <div
                        onClick={onLogoClick}
                        className={`flex items-center text-red-600 font-black text-xl lg:text-2xl tracking-tight italic gap-1 cursor-pointer hover:scale-105 transition-transform mr-4`}
                    >
                        <Zap className="fill-red-600 text-red-600" size={variant === 'light' ? 24 : 28} />
                        <span className={variant === 'dark' ? 'text-white' : ''}>PedeAí</span>
                    </div>
                )}

                <div className="flex flex-col">
                    {title && (
                        <h1 className={`text-lg lg:text-2xl font-black italic uppercase tracking-tighter truncate ${titleClasses}`}>
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {rightElement}
            </div>
        </header>
    );
};

export default AppHeader;
