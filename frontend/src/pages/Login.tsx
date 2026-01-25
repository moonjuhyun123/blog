import { useState } from "react";
import { login } from "../api/client";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // ✅ 클라이언트 검증
    if (!email.trim()) {
      setErr("이메일을 입력해주세요.");
      return;
    }
    if (!password.trim()) {
      setErr("비밀번호를 입력해주세요.");
      return;
    }

    try {
      await login(email, password);
      onLogin();
      nav("/");
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          "등록되지 않은 이메일이거나 비밀번호가 틀렸습니다."
      );
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={submit} className="form">
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
        {err && <p className="err">{err}</p>}
        <button className="btn" type="submit">
          Login
        </button>
        <div style={{ marginTop: 10 }}>
          <GoogleLoginButton
            mode="login"
            onSuccess={() => nav("/")}
            onError={(m) => setErr(m)}
          />
        </div>
      </form>
    </div>
  );
}
