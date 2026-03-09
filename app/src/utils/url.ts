/**
 * Validates and classifies a URL for use in Relay.
 */

interface UrlValidation {
  valid: boolean;
  normalized: string;
  isPrivate: boolean;
  isInsecure: boolean;
  warning: string | null;
  hostname: string;
}

const PRIVATE_RANGES = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // Tailscale CGNAT 100.64.0.0/10
  /\.local$/i,
  /\.internal$/i,
  /\.ts\.net$/i, // Tailscale domains
];

function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(hostname));
}

export function validateUrl(input: string): UrlValidation {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      valid: false,
      normalized: "",
      isPrivate: false,
      isInsecure: false,
      warning: "URL is required",
      hostname: "",
    };
  }

  // Add protocol if missing
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      valid: false,
      normalized: trimmed,
      isPrivate: false,
      isInsecure: false,
      warning: "Invalid URL format",
      hostname: "",
    };
  }

  const hostname = parsed.hostname;
  const isPrivate = isPrivateHostname(hostname);
  const isInsecure = parsed.protocol === "http:";

  // Allow insecure for private addresses, block for public
  if (isInsecure && !isPrivate) {
    return {
      valid: false,
      normalized: withProtocol,
      isPrivate,
      isInsecure,
      warning: "Public URLs must use HTTPS",
      hostname,
    };
  }

  let warning: string | null = null;
  if (isInsecure && isPrivate) {
    warning = "Using insecure HTTP on a local/private address";
  } else if (isPrivate) {
    warning = "This is a local/private address — ensure you have network access";
  }

  return {
    valid: true,
    normalized: withProtocol,
    isPrivate,
    isInsecure,
    warning,
    hostname,
  };
}

export function extractHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}
