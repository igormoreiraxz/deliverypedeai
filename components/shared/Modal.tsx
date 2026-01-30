
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    variant?: 'light' | 'dark';
    maxWidth?: string;
    showHeader?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    variant = 'light',
    maxWidth = 'max-w-lg',
    showHeader = true
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const bgClasses = variant === 'light' ? "bg-white" : "bg-gray-900 text-white";
    const closeBtnClasses = variant === 'light'
        ? "bg-gray-50 text-gray-400 hover:text-red-600"
        : "bg-gray-800 text-gray-500 hover:text-red-500";

    return (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={`${bgClasses} w-full ${maxWidth} rounded-t-[3rem] lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 lg:zoom-in-95 duration-500`}
            >
                {showHeader && (
                    <header className={`p-6 border-b ${variant === 'light' ? 'border-gray-50' : 'border-gray-800'} flex justify-between items-center shrink-0`}>
                        <div>
                            {title && (
                                <h2 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter text-inherit leading-none">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-3 rounded-2xl transition-all ${closeBtnClasses}`}
                        >
                            <X size={24} />
                        </button>
                    </header>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
