import { APP_DRAWER_ID } from "~/constants/layout";

/**
 * Set the shared daisyUI drawer state for responsive sync and keyboard activation.
 */
export const setDrawerToggleState = (nextChecked: boolean): void => {
  const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
  if (isDrawerOpen.value === nextChecked) {
    return;
  }
  isDrawerOpen.value = nextChecked;
};
