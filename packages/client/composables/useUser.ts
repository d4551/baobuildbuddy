import type { UserProfile } from "@navi/shared";
import { STATE_KEYS } from "@navi/shared";

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
      profile.value = data as UserProfile;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    loading.value = true;
    try {
      const { data, error } = await api.user.profile.put(updates);
      if (error) throw new Error("Failed to update profile");
      profile.value = data as UserProfile;
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
