import { APP_DRAWER_ID } from "~/constants/layout";

/**
 * Set the shared daisyUI drawer toggle state from native button controls.
 * Updates shared Vue state directly so drawer aria state and v-model stay aligned.
 */
export const setDrawerToggleState = (nextChecked: boolean): void => {
  const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
  if (isDrawerOpen.value === nextChecked) {
    return;
  }
  isDrawerOpen.value = nextChecked;
};

/**
 * Toggle the shared daisyUI drawer from native button controls.
 */
export const toggleDrawerToggleState = (): void => {
  const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
  setDrawerToggleState(!isDrawerOpen.value);
};
