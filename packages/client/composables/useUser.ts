import type { UserProfile } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { toUserProfile } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

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
    return withLoadingState(loading, async () => {
      const { data, error } = await api.user.profile.get();
      assertApiResponse(error, "Failed to fetch profile");
      const normalized = requireValue(toUserProfile(data), "Invalid user profile payload");
      profile.value = normalized;
    });
  }

  async function updateProfile(updates: UpdateUserProfileInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.user.profile.put(updates);
      assertApiResponse(error, "Failed to update profile");
      const normalized = requireValue(toUserProfile(data), "Invalid user profile payload");
      profile.value = normalized;
    });
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    fetchProfile,
    updateProfile,
  };
}
