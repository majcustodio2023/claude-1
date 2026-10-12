import "server-only";
import { getData, getToken } from "./store";
import type { AdAccount, TrackedCampaign, TrackerData } from "./types";

export async function resolveTracked(trackedId: string): Promise<{ data: TrackerData; tracked: TrackedCampaign; account: AdAccount; token: string }> {
  const data = await getData();
  const tracked = data.trackedCampaigns.find((t) => t.id === trackedId);
  if (!tracked) throw new Error("Campaign is not being tracked");
  const account = data.adAccounts.find((a) => a.id === tracked.adAccountRef);
  if (!account) throw new Error("Ad account not found");
  const token = await getToken(account.id);
  if (!token) throw new Error(`No access token saved for ${account.label}`);
  return { data, tracked, account, token };
}
