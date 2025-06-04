import React from "react";

export interface InputGroupProps {
  label: string;
  placeholder: string;
  hint?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
}

const InputGroup = ({
  label,
  placeholder,
  hint,
  value,
  defaultValue,
  onChange,
  children,
}: InputGroupProps) => {
  const isFilled = Boolean((value ?? defaultValue)?.toString().trim());
  return (
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-all duration-200 focus-within:shadow-[0_0_16px_0_rgba(66,153,225,0.25)] hover:shadow-[0_0_16px_0_rgba(66,153,225,0.25)]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors duration-200" />
            <label className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {label}
            </label>
          </div>
          <div className="flex items-center gap-2">
            {isFilled && (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" />
              </svg>
            )}
            {hint && (
              <div className="group/tooltip relative">
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-help">
                  <svg
                    className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <div className="absolute right-0 w-48 p-2 mt-1 text-xs text-gray-600 bg-white rounded-md shadow-xl border border-gray-100 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
                  {hint}
                </div>
              </div>
            )}
          </div>
        </div>
        <textarea
          className="w-full px-3 py-2 bg-transparent border-none text-sm min-h-[120px] resize-none focus:ring-0 placeholder-gray-400 text-gray-900"
          placeholder={placeholder}
          rows={4}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {children}
      </div>
    </div>
  );
};

export const AIButton = ({ onClick }: { onClick: () => void }) => (
  <div className="relative group">
    <div
      className="relative p-[1.4px] rounded-full shadow-[0_2px_16px_0_rgba(30,203,225,0.08)] group-hover:shadow-[0_4px_20px_0_rgba(30,203,225,0.2)] transition-all duration-300 group-hover:animate-conic-flow"
      style={{
        background: 'conic-gradient(from 0deg, #1ecbe1, #2563eb, #60a5fa, #1ecbe1)'
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1 rounded-full font-bold text-gray-800 bg-white focus:outline-none transition-all duration-200 text-sm min-w-[60px] min-h-[30px] justify-center shadow-md hover:shadow-lg hover:scale-105"
        style={{ border: 'none' }}
      >
        <span className="flex items-center" style={{marginTop: '-2px'}}>
          <svg width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.5 16C11.5 18.4853 9.48528 20.5 7 20.5C9.48528 20.5 11.5 22.5147 11.5 25C11.5 22.5147 13.5147 20.5 16 20.5C13.5147 20.5 11.5 18.4853 11.5 16Z" fill="#222"/>
            <path d="M21 10C21 11.6569 19.6569 13 18 13C19.6569 13 21 14.3431 21 16C21 14.3431 22.3431 13 24 13C22.3431 13 21 11.6569 21 10Z" fill="#222"/>
            <path d="M19 22C19 23.1046 18.1046 24 17 24C18.1046 24 19 24.8954 19 26C19 24.8954 19.8954 24 21 24C19.8954 24 19 23.1046 19 22Z" fill="#222"/>
          </svg>
        </span>
        <span className="font-bold text-sm tracking-tight">AI</span>
      </button>
    </div>
  </div>
);

export default InputGroup;
