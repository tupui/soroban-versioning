import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
}) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    {label && <span className="text-base text-primary">{label}</span>}
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`block w-10 h-6 rounded-full transition-colors ${disabled ? "bg-zinc-400" : checked ? "bg-indigo-600" : "bg-zinc-600"}`}
      />
      <div
        className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </div>
  </label>
);

export default Toggle;
