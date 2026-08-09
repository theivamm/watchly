import { useEffect, useState } from "react";
import type { Profile, UserAvatar } from "@/types";
import { getAvatarById } from "@/services/avatar";
import { avatarDataUri } from "@/lib/avatars";

export interface AvatarProps {
  profile: Profile | null | undefined;
  size?: number;
  border?: boolean;
  className?: string;
  alt?: string;
}

export default function Avatar({ profile, size = 40, border, className, alt }: AvatarProps) {
  const [avatar, setAvatar] = useState<UserAvatar | null>(null);

  useEffect(() => {
    const id = profile?.avatar_id;
    if (!id) {
      setAvatar(null);
      return;
    }
    let cancelled = false;
    getAvatarById(id).then((a) => {
      if (!cancelled) setAvatar(a ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_id]);

  const initial = (profile?.display_name || profile?.username || "W").charAt(0).toUpperCase();

  if (avatar?.seed) {
    const src = avatar.image_url || avatarDataUri(avatar.seed);
    return (
      <img
        src={src}
        alt={alt ?? (profile?.display_name || profile?.username || "Avatar")}
        width={size}
        height={size}
        className={`rounded-full object-cover ${border ? "border-2" : ""} ${className ?? ""}`}
        style={border ? { borderColor: "var(--accent)" } : undefined}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#0b0b14] flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 14px color-mix(in srgb, var(--accent) 35%, transparent)",
      }}
    >
      <span className="text-sm font-extrabold text-gradient" style={{ fontSize: Math.round(size / 2.2) }}>{initial}</span>
    </div>
  );
}
