import assert from "node:assert/strict";
import { test } from "node:test";
import { clientKeyword, groupCampaigns, groupOf } from "../lib/adgroups";
import type { TrackerData } from "../lib/types";

const data = {
  clients: [
    { id: "c1", name: "Opsified (ads management)", createdAt: "" },
    { id: "c2", name: "Zeta-Community Manager Commission", createdAt: "" },
    { id: "c3", name: "Local Ecom Hero", createdAt: "" },
  ],
  adGroups: [{ id: "g1", name: "Personal" }],
  adAccounts: [
    { id: "a1", label: "Personal Ads", owner: "Me", accountId: "1", group: "group:g1" },
    { id: "a2", label: "Opsified", owner: "Team", accountId: "2" },
  ],
  trackedCampaigns: [
    { id: "t1", adAccountRef: "a1", campaignId: "1", name: "ZETA VERSE LEAD CAMPAIGN", mode: "view", group: "client:c2" },
    { id: "t2", adAccountRef: "a1", campaignId: "2", name: "Agency | Book a call", mode: "view" },
    { id: "t3", adAccountRef: "a2", campaignId: "3", name: "Retargeting | ABO", mode: "view" },
    { id: "t4", adAccountRef: "a2", campaignId: "4", name: "Something else", mode: "view", group: "none" },
  ],
} as unknown as TrackerData;

test("client keywords skip generic words", () => {
  assert.equal(clientKeyword("Opsified (ads management)"), "opsified");
  assert.equal(clientKeyword("Zeta-Community Manager Commission"), "zeta");
  assert.equal(clientKeyword("Local Ecom Hero"), undefined);
});

test("campaign pick beats account group beats name match", () => {
  assert.equal(groupOf(data, data.trackedCampaigns[0]).name, "Zeta-Community Manager Commission");
  assert.equal(groupOf(data, data.trackedCampaigns[1]).name, "Personal");
  const auto = groupOf(data, data.trackedCampaigns[2]);
  assert.equal(auto.name, "Opsified (ads management)");
  assert.ok(auto.auto);
  assert.equal(groupOf(data, data.trackedCampaigns[3]).kind, "none");
});

test("groups list clients first, then custom groups, then ungrouped", () => {
  assert.deepEqual(
    groupCampaigns(data).map((g) => g.group.name),
    ["Opsified (ads management)", "Zeta-Community Manager Commission", "Personal", "Not grouped"],
  );
});
