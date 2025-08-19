interface SpinnerProps {
  className?: string;
}

const Spinner = ({ className = "" }: SpinnerProps) => {
  return (
    <div
      className={`w-4 h-4 border-2 border-white border-b-[#fff4] rounded-full animate-spin ${className}`}
    />
  );
};

export default Spinner;
