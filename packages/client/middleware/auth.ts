import { APP_ROUTES } from "@bao/shared";

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === APP_ROUTES.setup) return;

  const auth = useAuth();
  const { authRequired } = await auth.checkAuthStatus();

  if (!authRequired) return;

  const apiKey = auth.getStoredApiKey();
  if (!apiKey) {
    return navigateTo(APP_ROUTES.setup);
  }
});
