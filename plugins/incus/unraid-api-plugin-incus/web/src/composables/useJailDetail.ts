import { ref } from "vue";
import { gql } from "../graphql-client";
import { JAIL_DETAIL_QUERY } from "../graphql/operations";
import type { JailDetail } from "../types";

/** Owns the selected-container detail lifecycle and rejects stale responses. */
export function useJailDetail(onSelectionChange: () => void) {
  const detailsJailName = ref<string | null>(null);
  const jailDetail = ref<JailDetail | null>(null);
  const detailLoading = ref(false);
  const detailError = ref("");
  const editCpuLimit = ref("");
  const editMemoryLimit = ref("");
  const editWorkspacePath = ref("");
  let requestId = 0;

  async function toggleJailDetails(name: string) {
    onSelectionChange();
    if (detailsJailName.value === name) {
      ++requestId;
      detailsJailName.value = null;
      jailDetail.value = null;
      detailLoading.value = false;
      return;
    }
    detailsJailName.value = name;
    await loadJailDetail(name);
  }

  async function loadJailDetail(name: string) {
    const currentRequest = ++requestId;
    detailLoading.value = true;
    detailError.value = "";
    try {
      const data = await gql<{ jailDetail: JailDetail }>(JAIL_DETAIL_QUERY, { name });
      if (currentRequest !== requestId || detailsJailName.value !== name) return;
      jailDetail.value = data.jailDetail;
      editCpuLimit.value = data.jailDetail.cpuLimit ?? "";
      editMemoryLimit.value = data.jailDetail.memoryLimit ?? "";
      editWorkspacePath.value = data.jailDetail.workspaceHostPath ?? "";
    } catch (error) {
      if (currentRequest !== requestId || detailsJailName.value !== name) return;
      detailError.value = error instanceof Error ? error.message : String(error);
    } finally {
      if (currentRequest === requestId) detailLoading.value = false;
    }
  }

  return {
    detailsJailName, jailDetail, detailLoading, detailError,
    editCpuLimit, editMemoryLimit, editWorkspacePath,
    toggleJailDetails, loadJailDetail,
  };
}
