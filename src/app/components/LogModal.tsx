"use client";
import { IoCloseCircle } from "react-icons/io5";

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function LogModal({ isOpen, onClose, title, titleColor, icon, children }: LogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {icon}
            <span className={`${titleColor} font-medium text-lg`}>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoCloseCircle className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
