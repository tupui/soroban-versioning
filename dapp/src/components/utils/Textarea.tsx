import type { ChangeEventHandler, FC } from "react";

interface Props {
  className?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

const Textarea: FC<Props> = ({ className, placeholder, value, onChange }) => {
  return (
    <textarea
      className={`p-[18px] border border-[#978AA1] outline-none ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default Textarea;
