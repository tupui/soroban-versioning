import type { FC, MouseEventHandler, ReactNode } from "react";

interface Props {
  type?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button: FC<Props> = ({
  type = "primary",
  className,
  children,
  onClick,
}) => {
  return (
    <button
      className={`${type == "primary" ? "bg-primary text-white" : "bg-[#F5F1F9] text-primary"} flex justify-center items-center gap-3 p-[18px_30px] text-xl ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
