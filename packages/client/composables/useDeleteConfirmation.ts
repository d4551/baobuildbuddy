import { ref } from "vue";

export function useDeleteConfirmation() {
  const showDeleteDialog = ref(false);
  const pendingDeleteId = ref<string | null>(null);

  function requestDelete(id: string): void {
    pendingDeleteId.value = id;
    showDeleteDialog.value = true;
  }

  function clearDeleteState(): void {
    pendingDeleteId.value = null;
  }

  function closeDeleteDialog(): void {
    clearDeleteState();
    showDeleteDialog.value = false;
  }

  return {
    showDeleteDialog,
    pendingDeleteId,
    requestDelete,
    clearDeleteState,
    closeDeleteDialog,
  };
}
