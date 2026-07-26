import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { JobFilters, JobProvider, RawJob } from "./provider-interface";
/**
 * Provider for Hitmarker gaming jobs.
 */
export declare class HitmarkerProvider implements JobProvider {
    name: string;
    type: string;
    enabled: boolean;
    fetchJobs(filters?: JobFilters): Promise<RawJob[]>;
}
/**
 * Provider for RPA-backed gaming job portals.
 */
export declare class GamingPortalProvider implements JobProvider {
    name: string;
    type: string;
    enabled: boolean;
    private readonly portalId;
    constructor(portalId: GamingPortalId);
    fetchJobs(): Promise<RawJob[]>;
}
/**
 * Shared Hitmarker portal provider instance.
 */
export declare const hitmarkerPortalProvider: GamingPortalProvider;
/**
 * Shared GrackleHQ provider instance.
 */
export declare const grackleProvider: GamingPortalProvider;
/**
 * Shared Work With Indies provider instance.
 */
export declare const workWithIndiesProvider: GamingPortalProvider;
/**
 * Shared RemoteGameJobs provider instance.
 */
export declare const remoteGameJobsProvider: GamingPortalProvider;
/**
 * Shared GamesJobsDirect provider instance.
 */
export declare const gamesJobsDirectProvider: GamingPortalProvider;
/**
 * Shared PocketGamer.biz provider instance.
 */
export declare const pocketGamerProvider: GamingPortalProvider;
