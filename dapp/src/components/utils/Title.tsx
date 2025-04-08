import type { FC, ReactNode } from "react";

interface Props {
  title: ReactNode;
  description: ReactNode;
}

const Title: FC<Props> = ({ title, description }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="leading-6 text-2xl font-medium text-primary">{title}</div>
      <div className="text-base text-secondary">{description}</div>
    </div>
  );
};

export default Title;
