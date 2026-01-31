"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { me, register } from "../../lib/api";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    me()
      .then(() => router.replace("/"))
      .catch(() => null);
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

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
      router.push("/");
    } catch (e: any) {
      if (String(e?.message || "").includes("409")) {
        setErr("이미 등록된 이메일입니다.");
      } else {
        setErr(e?.message ?? "회원가입 실패");
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
        {err && <p className="err">{err}</p>}
        <button className="btn" type="submit">
          Create account
        </button>
        <div style={{ marginTop: 10 }}>
          <GoogleLoginButton
            mode="register"
            onSuccess={() => router.push("/")}
            onError={(m) => setErr(m)}
          />
        </div>
      </form>
    </div>
  );
}
