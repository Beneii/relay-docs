import { validateUrl, extractHostname } from "../utils/url";

describe("validateUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    const result = validateUrl("https://dashboard.example.com");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(false);
    expect(result.isInsecure).toBe(false);
    expect(result.warning).toBeNull();
  });

  it("auto-prepends https:// when missing", () => {
    const result = validateUrl("dashboard.example.com");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("https://dashboard.example.com");
  });

  it("rejects empty input", () => {
    const result = validateUrl("");
    expect(result.valid).toBe(false);
    expect(result.warning).toBe("URL is required");
  });

  it("rejects invalid URLs", () => {
    const result = validateUrl("not a url at all!!!");
    expect(result.valid).toBe(false);
  });

  it("rejects insecure public URLs", () => {
    const result = validateUrl("http://public-dashboard.com");
    expect(result.valid).toBe(false);
    expect(result.warning).toBe("Public URLs must use HTTPS");
  });

  it("allows HTTP for localhost", () => {
    const result = validateUrl("http://localhost:3000");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
    expect(result.isInsecure).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it("allows HTTP for 192.168.x.x", () => {
    const result = validateUrl("http://192.168.1.100:8080");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it("allows HTTP for 10.x.x.x", () => {
    const result = validateUrl("http://10.0.0.5:9090");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it("allows HTTP for 127.0.0.1", () => {
    const result = validateUrl("http://127.0.0.1:3000");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it("identifies Tailscale addresses as private", () => {
    const result = validateUrl("https://myhost.ts.net");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it("identifies .local addresses as private", () => {
    const result = validateUrl("https://server.local");
    expect(result.valid).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it("warns on private HTTPS addresses", () => {
    const result = validateUrl("https://192.168.1.1");
    expect(result.valid).toBe(true);
    expect(result.warning).toContain("local/private");
  });
});

describe("extractHostname", () => {
  it("extracts hostname from URL", () => {
    expect(extractHostname("https://dashboard.example.com/path")).toBe(
      "dashboard.example.com"
    );
  });

  it("returns input for invalid URLs", () => {
    expect(extractHostname("not-a-url")).toBe("not-a-url");
  });

  it("handles localhost", () => {
    expect(extractHostname("http://localhost:3000")).toBe("localhost");
  });
});
