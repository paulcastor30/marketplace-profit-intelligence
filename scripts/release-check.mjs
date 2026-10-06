import { readFile } from "node:fs/promises";
const gate = JSON.parse(await readFile("release-gate.json", "utf8"));
const pending = Object.entries(gate)
  .filter(
    ([key, value]) => !["version", "evidence"].includes(key) && value !== true,
  )
  .map(([key]) => key);
if (pending.length || !Array.isArray(gate.evidence) || !gate.evidence.length)
  throw new Error(
    "Release blocked: " + pending.join(", ") + "; evidence receipts required.",
  );
