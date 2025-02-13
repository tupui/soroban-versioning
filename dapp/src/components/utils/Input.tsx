import type { ChangeEventHandler, FC, ReactNode } from "react";

interface Props {
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

const Input: FC<Props> = ({
  className,
  label,
  description,
  placeholder,
  value,
  onChange,
}) => {
  return (
    <div className="flex-grow flex flex-col gap-[18px]">
      {label && (
        <p className="leading-4 text-base font-semibold text-primary">
          {label}
        </p>
      )}
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`p-[18px] border border-[#978AA1] outline-none ${className}`}
      />
      {description && (
        <p className="leading-[16px] text-base text-tertiary">{description}</p>
      )}
    </div>
  );
};

export default Input;
