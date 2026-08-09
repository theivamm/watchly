import { useEffect, useState } from "react";
import type { Profile, UserAvatar } from "@/types";
import { getAvatarById } from "@/lib/avatar-registry";

export interface AvatarProps {
  profile: Profile | null | undefined;
  size?: number;
  border?: boolean;
  className?: string;
  alt?: string;
}

// Los avatares vienen del bundle (src/assets/avatar/) y se resuelven por
// avatar_id mediante el registro estático. No se hace fetch ni generación.
export default function Avatar({ profile, size = 40, border, className, alt }: AvatarProps) {
  const [avatar, setAvatar] = useState<UserAvatar | null>(null);

  useEffect(() => {
    const id = profile?.avatar_id;
    if (!id) {
      setAvatar(null);
      return;
    }
    setAvatar(getAvatarById(id) ?? null);
  }, [profile?.avatar_id]);

  const initial = (profile?.display_name || profile?.username || "W").charAt(0).toUpperCase();

  if (avatar?.image_url) {
    return (
      <img
        src={avatar.image_url}
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
