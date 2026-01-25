import { useState } from "react";
import { register } from "../api/client";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Register({
  onRegistered,
}: {
  onRegistered: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState(""); // ✅ 비밀번호 확인
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // ✅ 클라이언트 단 검증
    if (password.length < 8) {
      setErr("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (password !== password2) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await register(displayName, email, password);
      onRegistered();
      nav("/");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        // ✅ 이메일 중복 처리
        setErr("이미 등록된 이메일입니다.");
      } else {
        setErr(e?.response?.data?.message ?? "회원가입 실패");
      }
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={submit} className="form">
        <label>
          Nickname
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </label>

        {/* 오류 메시지 */}
        {err && <p className="err">{err}</p>}

        <button className="btn" type="submit">
          Create account
        </button>
        <div style={{ marginTop: 10 }}>
          <GoogleLoginButton
            mode="register"
            onSuccess={() => nav("/")}
            onError={(m) => setErr(m)}
          />
        </div>
      </form>
    </div>
  );
}
