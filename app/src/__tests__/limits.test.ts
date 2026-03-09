jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("@/stores/authStore", () => ({ useAuthStore: jest.fn() }));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));

import { FREE_LIMITS, PRO_LIMITS, getLimits } from "@shared/product";

describe("FREE_LIMITS", () => {
  it("allows 3 dashboards", () => {
    expect(FREE_LIMITS.dashboards).toBe(3);
  });

  it("allows 1 device", () => {
    expect(FREE_LIMITS.devices).toBe(1);
  });

  it("allows 100 notifications per month", () => {
    expect(FREE_LIMITS.notificationsPerMonth).toBe(100);
  });
});

describe("PRO_LIMITS", () => {
  it("allows unlimited dashboards", () => {
    expect(PRO_LIMITS.dashboards).toBe(Infinity);
  });

  it("allows 10 devices", () => {
    expect(PRO_LIMITS.devices).toBe(10);
  });

  it("allows 10,000 notifications per month", () => {
    expect(PRO_LIMITS.notificationsPerMonth).toBe(10_000);
  });
});

describe("getLimits", () => {
  it("returns FREE_LIMITS for free plan", () => {
    expect(getLimits("free")).toBe(FREE_LIMITS);
  });

  it("returns PRO_LIMITS for pro plan", () => {
    expect(getLimits("pro")).toBe(PRO_LIMITS);
  });
});
