import type { ChangeEventHandler, FC } from "react";

interface Props {
  className?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

const Input: FC<Props> = ({ className, placeholder, value, onChange }) => {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`p-[18px] border border-[#978AA1] outline-none ${className}`}
    />
  );
};

export default Input;
