export default defineNuxtPlugin(() => {
  const { success, error, info, warning } = useToast();

  return {
    provide: {
      toast: {
        success,
        error,
        info,
        warning,
      },
    },
  };
});
