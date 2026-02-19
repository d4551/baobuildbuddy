export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/setup") return;

  const auth = useAuth();
  const { authRequired } = await auth.checkAuthStatus();

  if (!authRequired) return;

  const apiKey = auth.getStoredApiKey();
  if (!apiKey) {
    return navigateTo("/setup");
  }
});
