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
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <img src="/images/loading.svg" className="w-10 animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
};

export default Loading;
