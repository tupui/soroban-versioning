import type { ChangeEventHandler, FC, ReactNode } from "react";

interface Props {
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error?: string | null | undefined;
  helpText?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  type?: string;
}

const Input: FC<Props> = ({
  className,
  label,
  description,
  placeholder,
  value,
  onChange,
  helpText,
  multiline = false,
  rows = 3,
  error,
  disabled,
  type = "text",
}) => {
  return (
    <div className="flex-grow flex flex-col gap-[18px]">
      {label && (
        <p className={`leading-4 text-base font-semibold ${disabled ? "text-gray-400" : "text-primary"}`}>
          {label}
        </p>
      )}
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          disabled={disabled}
          className={`p-[18px] border ${error ? "border-red-500" : "border-[#978AA1]"} outline-none resize-vertical ${disabled ? "bg-gray-100 text-gray-400" : ""} ${className}`}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`p-[18px] border ${error ? "border-red-500" : "border-[#978AA1]"} outline-none ${disabled ? "bg-gray-100 text-gray-400" : ""} ${className}`}
        />
      )}
      {helpText && (
        <p className="leading-[16px] text-base text-gray-600">{helpText}</p>
      )}
      {error ? (
        <p className="leading-[16px] text-base text-red-500">{error}</p>
      ) : description ? (
        <p className="leading-[16px] text-base text-tertiary">{description}</p>
      ) : null}
    </div>
  );
};

export default Input;
