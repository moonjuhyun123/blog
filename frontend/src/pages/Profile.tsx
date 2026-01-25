import { useEffect, useState } from "react";
import { me, patchMe } from "../api/client";
import type { User } from "../api/types";

function toImgSrc(path?: string | null) {
  if (!path) return "https://via.placeholder.com/64x64.png?text=User";
  // 절대 URL이면 그대로
  if (/^https?:\/\//i.test(path)) return path;
  // 상대 경로면 /uploads 접두사 추가
  return `/uploads${
    // 배포땐 바꾸기
    path.startsWith("/") ? "" : "/"
  }${path}`;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [displayNameEdit, setDisplayNameEdit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imgBust, setImgBust] = useState(0); // 캐시 무력화용

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (!user) return <p>Loading…</p>;

  const save = async () => {
    const updated = await patchMe({
      displayName: displayNameEdit || undefined,
      profileImage: file || undefined,
    });

    // 1) 상태 업데이트(소프트 리프레시)
    setUser(updated);
    setDisplayNameEdit("");
    setFile(null);

    // 2) 이미지 캐시 버스트
    setImgBust(Date.now());

    // 3) 필요하면 하드 리프레시 1회 (선호하시면 주석 해제)
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
