import type { FC, MouseEventHandler, ReactNode } from "react";
import type { AnyObject, Size } from "types/types";
import Spinner from "./Spinner";

interface Props {
  id?: string;
  type?: "primary" | "secondary" | "tertiary" | "quaternary";
  order?: "primary" | "secondary";
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
  id,
  type = "primary",
  order = "primary",
  size = "md",
  className,
  children,
  icon,
  isLoading,
  onClick,
}) => {
  return (
    <button
      id={id}
      className={`${className} ${type == "primary" ? "bg-primary text-white" : type == "secondary" ? "bg-[#F5F1F9] text-primary" : type == "tertiary" ? "border border-primary text-primary" : "bg-white text-primary"} cursor-pointer flex justify-center items-center ${sizeMap[size]}`}
      onClick={onClick}
    >
      {isLoading && <Spinner />}
      {order === "primary" && (
        <>
          {icon && <img src={icon} />}
          {children}
        </>
      )}
      {order === "secondary" && (
        <>
          {children}
          {icon && <img src={icon} />}
        </>
      )}
    </button>
  );
};

export default Button;
