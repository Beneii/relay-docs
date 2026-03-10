export interface RelayManifestTab {
  id?: string;
  name: string;
  path: string;
  icon?: string;
  channel?: string;
}

export interface RelayManifestInput {
  $schema?: string;
  schema_version?: number;
  name: string;
  description?: string;
  icon?: string;
  theme_color?: string;
  background_color?: string;
  tabs?: RelayManifestTab[];
  notifications?: boolean;
  default_channel?: string;
  webhook_base_url?: string;
  metadata?: Record<string, string>;
}

export interface RelayManifestV1 extends Omit<RelayManifestInput, "schema_version" | "tabs"> {
  $schema: string;
  schema_version: 1;
  tabs?: RelayManifestTab[];
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const DEFAULT_SCHEMA_URL = "https://relayapp.dev/schema/v1";

function ensureString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeChannel(value?: string, fieldName = "channel") {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized) {
    throw new Error(`${fieldName} must contain alphanumeric characters`);
  }
  return normalized;
}

function sanitizePath(path: string) {
  let result = path.trim();
  if (!result.startsWith("/")) {
    result = `/${result}`;
  }
  if (result.length > 1 && result.endsWith("/")) {
    result = result.replace(/\/+$/, "");
  }
  return result;
}

function validateTabs(tabs?: RelayManifestTab[]): RelayManifestTab[] | undefined {
  if (tabs === undefined) {
    return undefined;
  }
  if (!Array.isArray(tabs)) {
    throw new Error("tabs must be an array");
  }
  return tabs.map((tab, index) => {
    if (!tab || typeof tab !== "object") {
      throw new Error(`tab at index ${index} must be an object`);
    }
    const name = ensureString(tab.name, `tabs[${index}].name`);
    const path = sanitizePath(ensureString(tab.path, `tabs[${index}].path`));
    const channel = tab.channel ? sanitizeChannel(tab.channel, `tabs[${index}].channel`) : undefined;
    if (
      tab.icon &&
      !isHttpsUrl(tab.icon) &&
      !tab.icon.startsWith("/") &&
      !tab.icon.startsWith("data:")
    ) {
      throw new Error(
        `tabs[${index}].icon must be a relative path (e.g. /icon.png), an https URL, or a data URI`
      );
    }
    return {
      ...("id" in tab ? { id: ensureString(tab.id ?? "", `tabs[${index}].id`) } : {}),
      name,
      path,
      ...(tab.icon ? { icon: tab.icon } : {}),
      ...(channel ? { channel } : {}),
    };
  });
}

export function relayConfig(input: RelayManifestInput): RelayManifestV1 {
  if (!input || typeof input !== "object") {
    throw new Error("relay.config requires a manifest object");
  }

  const name = ensureString(input.name, "name");
  const manifest: RelayManifestV1 = {
    $schema: input.$schema ? ensureString(input.$schema, "$schema") : DEFAULT_SCHEMA_URL,
    schema_version: 1,
    name,
  };

  if (input.description !== undefined) {
    manifest.description = ensureString(input.description, "description");
  }

  if (input.icon !== undefined) {
    if (
      !isHttpsUrl(input.icon) &&
      !input.icon.startsWith("/") &&
      !input.icon.startsWith("data:")
    ) {
      throw new Error(
        "icon must be a relative path (e.g. /icon.png), an https URL, or a data URI"
      );
    }
    manifest.icon = input.icon;
  }

  if (input.theme_color !== undefined) {
    if (!HEX_COLOR_REGEX.test(input.theme_color)) {
      throw new Error("theme_color must be a hex string like #RRGGBB");
    }
    manifest.theme_color = input.theme_color.toLowerCase();
  }

  if (input.background_color !== undefined) {
    if (!HEX_COLOR_REGEX.test(input.background_color)) {
      throw new Error("background_color must be a hex string like #RRGGBB");
    }
    manifest.background_color = input.background_color.toLowerCase();
  }

  const tabs = validateTabs(input.tabs);
  if (tabs) {
    manifest.tabs = tabs;
  }

  if (input.notifications !== undefined) {
    manifest.notifications = Boolean(input.notifications);
  }

  if (input.default_channel !== undefined) {
    manifest.default_channel = sanitizeChannel(input.default_channel, "default_channel");
  }

  if (input.webhook_base_url !== undefined) {
    if (!isHttpsUrl(input.webhook_base_url)) {
      throw new Error("webhook_base_url must be an https URL");
    }
    manifest.webhook_base_url = input.webhook_base_url;
  }

  if (input.metadata !== undefined) {
    if (typeof input.metadata !== "object" || Array.isArray(input.metadata)) {
      throw new Error("metadata must be an object with string values");
    }
    const metadataEntries = Object.entries(input.metadata);
    const record: Record<string, string> = {};
    for (const [key, value] of metadataEntries) {
      const sanitizedKey = ensureString(key, "metadata key");
      if (typeof value !== "string") {
        throw new Error(`metadata value for ${sanitizedKey} must be a string`);
      }
      record[sanitizedKey] = value;
    }
    manifest.metadata = record;
  }

  return manifest;
}
