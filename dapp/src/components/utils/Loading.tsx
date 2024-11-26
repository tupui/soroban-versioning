import React from "react";

const Loading = ({ theme = "light" }: { theme?: "dark" | "light" }) => {
  const bgColor = theme === "dark" ? "bg-white" : "bg-black";

  return (
    <div className="flex space-y-4 space-x-2 justify-center items-center dark:invert">
      <span className="sr-only">Loading...</span>
      <div
        className={`h-8 w-8 ${bgColor} rounded-full animate-bounce [animation-delay:-0.3s]`}
      ></div>
      <div
        className={`h-8 w-8 ${bgColor} rounded-full animate-bounce [animation-delay:-0.15s]`}
      ></div>
      <div className={`h-8 w-8 ${bgColor} rounded-full animate-bounce`}></div>
    </div>
  );
};

export default Loading;
