import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

export const AVATAR_STYLE = "open-peeps";

const WATCHLY_SEED_COLORS = [
  "8b5cf6", // violet
  "a855f7",
  "c084fc",
  "ec4899", // rose
  "f43f5f",
  "fb7185",
  "38bdf8", // sky
  "0ea5e9",
  "22c55e", // lime
  "84cc16",
  "facc15", // amber
  "f97316", // orange
];

export function avatarSeedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return WATCHLY_SEED_COLORS[Math.abs(h) % WATCHLY_SEED_COLORS.length];
}

export function avatarDataUri(seed: string): string {
  const avatar = createAvatar(openPeeps, {
    seed,
    backgroundColor: [avatarSeedColor(seed)],
  });
  return avatar.toDataUri();
}
