"use client";

import { useEffect, useRef } from "react";
import { googleLogin } from "../../lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleLoginButton({
  mode = "login",
  onSuccess,
  onError,
  width = 320,
  height = 44,
}: {
  mode?: "login" | "register";
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  width?: number;
  height?: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  useEffect(() => {
    successRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "577653110613-dqcpoe7qkjacdsosrb0namlrfuvsm26m.apps.googleusercontent.com";

  useEffect(() => {
    const scriptId = "google-gsi";

    const render = () => {
      if (!window.google || !divRef.current) return;

      if (!inited.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: { credential?: string }) => {
            try {
              const idToken = resp?.credential;
              if (!idToken) throw new Error("id_token 수신 실패");
              await googleLogin(idToken);
              window.location.replace("/");
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : "Google 인증 중 오류가 발생했습니다.";
              errorRef.current?.(message);
            }
          },
          ux_mode: "popup",
          auto_select: false,
          use_fedcm_for_button: true,
          locale: "ko",
        });
        inited.current = true;
      }

      divRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        text: mode === "register" ? "signup_with" : "signin_with",
        logo_alignment: "left",
        width,
      });
    };

    const init = () => {
      if (!window.google) return;
      render();
    };

    let s = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.head.appendChild(s);
    } else {
      init();
    }
  }, [clientId, mode, width, height]);

  return (
    <div
      ref={divRef}
      aria-label={mode === "register" ? "Google로 가입" : "Google로 로그인"}
      style={{
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
