import type { FC, MouseEventHandler, ReactNode } from "react";
import type { AnyObject, Size } from "types/types";
import Spinner from "./Spinner";

interface Props {
  type?: "primary" | "secondary" | "tertiary";
  size?: Size;
  className?: string;
  children?: ReactNode;
  icon?: string;
  isLoading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}

const sizeMap: AnyObject = {
  "2xs": "p-[7px] gap-1 leading-[10px] text-xs",
  xs: "p-[10px] gap-1 leading-3 text-sm",
  sm: "p-[10px_20px] gap-2 leading-4 text-base",
  md: "p-[12px_24px] gap-3 leading-[18px] text-lg",
  xl: "p-[18px_30px] gap-4 leading-5 text-xl",
};

const Button: FC<Props> = ({
  type = "primary",
  size = "md",
  className,
  children,
  icon,
  isLoading,
  onClick,
}) => {
  return (
    <button
      className={`${className} ${type == "primary" ? "bg-primary text-white" : type == "secondary" ? "bg-[#F5F1F9] text-primary" : "border border-primary text-primary"} flex justify-center items-center ${sizeMap[size]}`}
      onClick={onClick}
    >
      {isLoading && <Spinner />}
      {icon && <img src={icon} />}
      {children}
    </button>
  );
};

export default Button;
