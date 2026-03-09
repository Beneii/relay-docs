import { timeAgo } from "../utils/time";

describe("timeAgo", () => {
  function minutesAgo(n: number): string {
    return new Date(Date.now() - n * 60 * 1000).toISOString();
  }

  function hoursAgo(n: number): string {
    return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
  }

  function daysAgo(n: number): string {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  }

  it("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes for < 1 hour", () => {
    expect(timeAgo(minutesAgo(5))).toBe("5m ago");
    expect(timeAgo(minutesAgo(30))).toBe("30m ago");
  });

  it("returns hours for < 1 day", () => {
    expect(timeAgo(hoursAgo(2))).toBe("2h ago");
    expect(timeAgo(hoursAgo(23))).toBe("23h ago");
  });

  it("returns days for < 1 week", () => {
    expect(timeAgo(daysAgo(1))).toBe("1d ago");
    expect(timeAgo(daysAgo(6))).toBe("6d ago");
  });

  it("returns weeks for < 4 weeks", () => {
    expect(timeAgo(daysAgo(14))).toBe("2w ago");
  });

  it("returns months for < 12 months", () => {
    expect(timeAgo(daysAgo(60))).toBe("2mo ago");
  });

  it("returns years for > 12 months", () => {
    expect(timeAgo(daysAgo(400))).toBe("1y ago");
  });
});
