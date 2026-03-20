import { DESKTOP_RELEASE_TARGETS } from "../../packages/shared/src/constants/scripts";

export type DesktopReleaseVerifyTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

/**
 * Returns canonical desktop release targets that appear in the assembled provenance map,
 * in stable DESKTOP_RELEASE_TARGETS order.
 */
export const orderTargetsPresentInProvenance = (
  provenanceTargetKeys: ReadonlySet<string>,
): readonly DesktopReleaseVerifyTarget[] =>
  DESKTOP_RELEASE_TARGETS.filter((target) => provenanceTargetKeys.has(target));
