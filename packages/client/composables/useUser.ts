import type { UserProfile } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toUserProfile } from "./api-normalizers";

type ApiClient = ReturnType<typeof useApi>;
type UpdateUserProfileInput = NonNullable<Parameters<ApiClient["user"]["profile"]["put"]>[0]>;

/**
 * User profile management composable.
 */
export function useUser() {
  const api = useApi();
  const profile = useState<UserProfile | null>(STATE_KEYS.USER_PROFILE, () => null);
  const loading = useState(STATE_KEYS.USER_LOADING, () => false);

  async function fetchProfile() {
    loading.value = true;
    try {
      const { data, error } = await api.user.profile.get();
      if (error) throw new Error("Failed to fetch profile");
      const normalized = toUserProfile(data);
      if (!normalized) throw new Error("Invalid user profile payload");
      profile.value = normalized;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(updates: UpdateUserProfileInput) {
    loading.value = true;
    try {
      const { data, error } = await api.user.profile.put(updates);
      if (error) throw new Error("Failed to update profile");
      const normalized = toUserProfile(data);
      if (!normalized) throw new Error("Invalid user profile payload");
      profile.value = normalized;
    } finally {
      loading.value = false;
    }
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    fetchProfile,
    updateProfile,
  };
}
