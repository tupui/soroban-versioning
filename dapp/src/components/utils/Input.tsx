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
}) => {
  return (
    <div className="flex-grow flex flex-col gap-[18px]">
      {label && (
        <p className="leading-4 text-base font-semibold text-primary">
          {label}
        </p>
      )}
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          className={`p-[18px] border ${error ? "border-red-500" : "border-[#978AA1]"} outline-none resize-vertical ${className}`}
        />
      ) : (
        <input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`p-[18px] border ${error ? "border-red-500" : "border-[#978AA1]"} outline-none ${className}`}
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
