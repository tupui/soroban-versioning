/**
 * React Loading Component
 *
 * This is the React implementation of the Loading component, used for dynamic loading indicators
 * in React components. It provides a simple loading animation with theme options.
 *
 * NOTE: For static loading indicators in Astro components, use Loading.astro instead.
 * The two implementations should maintain identical styling for consistency.
 */

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
