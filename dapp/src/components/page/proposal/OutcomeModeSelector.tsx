import React from "react";

interface OutcomeModeSelectorProps {
  mode: "xdr" | "contract" | "none";
  onModeChange: (mode: "xdr" | "contract" | "none") => void;
  disabled?: boolean;
}

export const OutcomeModeSelector: React.FC<OutcomeModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => !disabled && onModeChange("none")}
        disabled={disabled}
        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          mode === "none"
            ? "bg-primary text-white shadow-sm"
            : "text-secondary hover:text-primary hover:bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <span>None</span>
          <span className="text-xs opacity-75">(Description Only)</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => !disabled && onModeChange("contract")}
        disabled={disabled}
        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          mode === "contract"
            ? "bg-primary text-white shadow-sm"
            : "text-secondary hover:text-primary hover:bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <span>Contract</span>
          <span className="text-xs opacity-75">(Recommended)</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => !disabled && onModeChange("xdr")}
        disabled={disabled}
        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          mode === "xdr"
            ? "bg-primary text-white shadow-sm"
            : "text-secondary hover:text-primary hover:bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <span>XDR</span>
          <span className="text-xs opacity-75">(Advanced)</span>
        </div>
      </button>
    </div>
  );
};

export default OutcomeModeSelector;
