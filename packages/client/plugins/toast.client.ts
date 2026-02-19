export default defineNuxtPlugin(() => {
  let toastContainer: HTMLDivElement | null = null;
  let toastIdCounter = 0;

  const createToastContainer = () => {
    if (toastContainer) return toastContainer;

    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast toast-top toast-center z-[1000]";
    document.body.appendChild(toastContainer);

    return toastContainer;
  };

  const showToast = (message: string, type: "success" | "error" | "info" | "warning") => {
    const container = createToastContainer();
    const toastId = `toast-${toastIdCounter++}`;

    const alertTypeClasses = {
      success: "alert-success",
      error: "alert-error",
      info: "alert-info",
      warning: "alert-warning",
    };

    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    };

    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `alert ${alertTypeClasses[type]} shadow-lg`;
    toast.innerHTML = `
      <div class="flex items-start gap-2">
        ${icons[type]}
        <div>
          <h3 class="font-bold">${type.toUpperCase()}</h3>
          <div class="text-xs">${message}</div>
        </div>
      </div>
    `;

    container.appendChild(toast);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        container.removeChild(toast);
      }
      // Clean up container if empty
      if (container.children.length === 0 && container.parentNode) {
        document.body.removeChild(container);
        toastContainer = null;
      }
    }, 3000);
  };

  return {
    provide: {
      toast: {
        success: (message: string) => showToast(message, "success"),
        error: (message: string) => showToast(message, "error"),
        info: (message: string) => showToast(message, "info"),
        warning: (message: string) => showToast(message, "warning"),
      },
    },
  };
});
