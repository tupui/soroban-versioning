import type { ComponentType } from "react";

type PropsWithOnClose<P> = P & { onClose: () => void };

/** Mount a React modal in a full-screen overlay; closes on overlay click and unmounts on close. */
export async function mountModal<P extends Record<string, unknown>>(
  containerClass: string,
  loadComponent: () => Promise<{ default: ComponentType<PropsWithOnClose<P>> }>,
  getProps: (onClose: () => void) => P | Promise<P>,
  options: { closeOnOverlayClick?: boolean } = {},
): Promise<void> {
  const { closeOnOverlayClick = true } = options;

  if (document.querySelector(`.${containerClass.split(" ")[0]}`)) {
    return;
  }

  const container = document.createElement("div");
  container.className = containerClass;
  document.body.appendChild(container);

  const [React, { createRoot }] = await Promise.all([
    import("react"),
    import("react-dom/client"),
  ]);

  const root = createRoot(container);

  const onClose = (): void => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    try {
      root.unmount();
    } catch {
      // ignore
    }
  };

  if (closeOnOverlayClick) {
    container.addEventListener("click", (e) => {
      if (e.target === container) onClose();
    });
  } else {
    container.addEventListener("click", (e) => {
      if (e.target === container) e.preventDefault();
    });
  }

  const Component = (await loadComponent()).default;
  const props = await getProps(onClose);
  root.render(
    React.createElement(Component, {
      ...props,
      onClose,
    } as PropsWithOnClose<P>),
  );
}
