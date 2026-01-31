"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me, patchMe } from "../../lib/api";
import type { User } from "../../lib/types";

function toImgSrc(path?: string | null) {
  if (!path) return "https://via.placeholder.com/64x64.png?text=User";
  if (/^https?:\/\//i.test(path)) return path;
  return `/uploads${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayNameEdit, setDisplayNameEdit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imgBust, setImgBust] = useState(0);
  const router = useRouter();

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) return <p>Loading…</p>;

  const save = async () => {
    const updated = await patchMe({
      displayName: displayNameEdit || undefined,
      profileImage: file || undefined,
    });

    setUser(updated);
    setDisplayNameEdit("");
    setFile(null);
    setImgBust(Date.now());
    window.location.reload();
  };

  const imgSrc = `${toImgSrc(user.profileImageUrl)}?v=${imgBust || 0}`;

  return (
    <div className="card">
      <h2>My Profile</h2>
      <div className="row">
        <img
          src={imgSrc}
          width={64}
          height={64}
          style={{ borderRadius: 8, objectFit: "cover" }}
          alt={user.displayName}
        />
        <div>
          <div>
            <b>{user.displayName}</b>
          </div>
          <div>{user.email}</div>
          <div>role: {user.role}</div>
          {user.blocked && <div className="badge danger">Blocked</div>}
        </div>
      </div>

      <div className="form" style={{ marginTop: 16 }}>
        <label>
          New nickname
          <input
            value={displayNameEdit}
            onChange={(e) => setDisplayNameEdit(e.target.value)}
          />
        </label>
        <label>
          Profile image (jpg)
          <input
            type="file"
            accept="image/jpeg,image/jpg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <button className="btn" onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
