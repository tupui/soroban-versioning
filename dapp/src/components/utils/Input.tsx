import type { FC, ReactNode, InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string | null | undefined;
}

const Input: FC<Props> = ({
  className,
  label,
  description,
  error,
  ...inputProps
}) => {
  return (
    <div className="flex-grow flex flex-col gap-[18px]">
      {label && (
        <p className="leading-4 text-base font-semibold text-primary">
          {label}
        </p>
      )}

      <input
        {...inputProps}
        className={`p-[18px] border ${
          error ? "border-red-500" : "border-[#978AA1]"
        } outline-none ${className ?? ""}`}
      />

      {error ? (
        <p className="leading-[16px] text-base text-red-500">{error}</p>
      ) : description ? (
        <p className="leading-[16px] text-base text-tertiary">{description}</p>
      ) : null}
    </div>
  );
};

export default Input;
