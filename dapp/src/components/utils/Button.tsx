import type { FC, MouseEventHandler, ReactNode } from "react";

interface Props {
  type?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
  icon?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button: FC<Props> = ({
  type = "primary",
  size = "md",
  className,
  children,
  icon,
  onClick,
}) => {
  return (
    <button
      className={`${type == "primary" ? "bg-primary text-white" : "bg-[#F5F1F9] text-primary"} flex justify-center items-center gap-3 ${size == "sm" ? "p-[10px_20px]" : size == "md" ? "p-[12px_24px]" : "p-[18px_30px]"} text-xl ${className}`}
      onClick={onClick}
    >
      {icon && <img src={icon} />}
      {children}
    </button>
  );
};

export default Button;
