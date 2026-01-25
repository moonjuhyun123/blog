import { useEffect, useRef } from "react";
import { googleLogin } from "../api/client";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleLoginButton({
  mode = "login",
  onSuccess, // 새로고침하므로 보통은 안 써도 됨
  onError,
  width = 320, // 고정 폭(흔들림 방지, 200px 이상 권장)
  height = 44, // 고정 높이
}: {
  mode?: "login" | "register";
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  width?: number;
  height?: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  // 최신 콜백 유지(의존성에서 제외)
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  useEffect(() => {
    successRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  const clientId =
    "577653110613-dqcpoe7qkjacdsosrb0namlrfuvsm26m.apps.googleusercontent.com";

  useEffect(() => {
    const scriptId = "google-gsi";

    const render = () => {
      if (!window.google || !divRef.current) return;

      // initialize는 최초 1회만
      if (!inited.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            try {
              const idToken = resp?.credential;
              if (!idToken) throw new Error("id_token 수신 실패");
              await googleLogin(idToken);

              // ✅ 구글 버튼에서만: 성공 시 한 번 전체 새로고침
              window.location.replace("/");

              // (새로고침 때문에 onSuccess는 보통 불릴 틈이 없음)
              // successRef.current?.();
            } catch (e: any) {
              errorRef.current?.(
                e?.response?.data?.message ??
                  "Google 인증 중 오류가 발생했습니다."
              );
            }
          },
          ux_mode: "popup",
          auto_select: false,
          use_fedcm_for_button: true, // 개인화/안정화에 도움
          locale: "ko",
        });
        inited.current = true;
      }

      // 버튼 렌더(폭/높이 고정, 모드 바뀔 때만 다시 그림)
      divRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        text: mode === "register" ? "signup_with" : "signin_with",
        logo_alignment: "left",
        width, // 고정 폭 → 길이 변동 없음
      });
    };

    const init = () => {
      if (!window.google) return;
      render();
    };

    // 스크립트는 페이지당 1회만 로드(제거하지 않음)
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
        width, // 컨테이너도 공간 예약
        height, // 버튼 높이만큼 예약
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
