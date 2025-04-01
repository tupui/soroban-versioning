import type { FC, ReactNode } from "react";

interface Props {
  label?: ReactNode;
  children?: ReactNode;
}

const Label: FC<Props> = ({ label, children }) => {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="leading-4 text-base text-secondary">{label}</div>
      {children}
    </div>
  );
};

export default Label;
