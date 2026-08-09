import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";

export const AVATAR_STYLE = "avataaars";

const WATCHLY_SEED_COLORS = [
  "8b5cf6", // violet
  "a855f7",
  "c084fc",
  "ec4899", // rose/pink
  "f43f5f",
  "fb7185",
  "38bdf8", // sky
  "0ea5e9",
  "22c55e", // lime/green
  "84cc16",
  "facc15", // yellow/amber
  "f97316", // orange
];

export function avatarSeedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return WATCHLY_SEED_COLORS[Math.abs(h) % WATCHLY_SEED_COLORS.length];
}

export function avatarDataUri(seed: string): string {
  const avatar = createAvatar(avataaars, {
    seed,
    backgroundColor: [avatarSeedColor(seed)],
    style: ["circle"],
  });
  return avatar.toDataUri();
}
