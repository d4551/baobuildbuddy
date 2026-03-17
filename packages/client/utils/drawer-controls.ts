import { APP_DRAWER_ID } from "~/constants/layout";

const resolveDrawerToggle = (): HTMLInputElement | null => {
  if (!import.meta.client) {
    return null;
  }

  const drawerToggle = document.getElementById(APP_DRAWER_ID);
  return drawerToggle instanceof HTMLInputElement ? drawerToggle : null;
};

/**
 * Set the shared daisyUI drawer toggle state from native button controls.
 */
export const setDrawerToggleState = (nextChecked: boolean): void => {
  const drawerToggle = resolveDrawerToggle();
  if (!drawerToggle || drawerToggle.checked === nextChecked) {
    return;
  }

  drawerToggle.checked = nextChecked;
  drawerToggle.dispatchEvent(new Event("change", { bubbles: true }));
};

/**
 * Toggle the shared daisyUI drawer checkbox from native button controls.
 */
export const toggleDrawerToggleState = (): void => {
  const drawerToggle = resolveDrawerToggle();
  if (!drawerToggle) {
    return;
  }

  setDrawerToggleState(!drawerToggle.checked);
};
