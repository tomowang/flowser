import { storage } from "#imports";

export type ExecutionRetention = "forever" | 100 | 500 | 1000 | 5000 | 10000;

const RETENTION_COUNTS = [100, 500, 1000, 5000, 10000] as const;

export const supportedExecutionRetentions: {
  code: ExecutionRetention;
  labelKey: string;
}[] = [
  { code: "forever", labelKey: "settings.executionRetentionForever" },
  ...RETENTION_COUNTS.map((count) => ({
    code: count,
    labelKey: "settings.executionRetentionCount",
  })),
];

const STORAGE_KEY = "local:flowser_execution_retention";
const DEFAULT_RETENTION: ExecutionRetention = "forever";

function isExecutionRetention(value: unknown): value is ExecutionRetention {
  return (
    value === "forever" ||
    RETENTION_COUNTS.includes(value as (typeof RETENTION_COUNTS)[number])
  );
}

export async function getExecutionRetention(): Promise<ExecutionRetention> {
  const stored = await storage.getItem<ExecutionRetention>(STORAGE_KEY);
  return isExecutionRetention(stored) ? stored : DEFAULT_RETENTION;
}

export async function setExecutionRetention(
  value: ExecutionRetention,
): Promise<void> {
  await storage.setItem(STORAGE_KEY, value);
}
