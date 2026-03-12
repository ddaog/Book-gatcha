"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const submitLabel = mode === "login" ? "로그인" : "회원가입";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/gacha");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setMessage("회원가입이 완료되었습니다. 로그인해 주세요.");
      setMode("login");
    } catch (authError) {
      setMessage(
        authError instanceof Error ? authError.message : "인증 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "login" ? "default" : "secondary"}
          type="button"
          onClick={() => setMode("login")}
          className="flex-1"
        >
          로그인
        </Button>
        <Button
          variant={mode === "signup" ? "default" : "secondary"}
          type="button"
          onClick={() => setMode("signup")}
          className="flex-1"
        >
          회원가입
        </Button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm text-zinc-300">
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          비밀번호
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </label>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "처리 중..." : submitLabel}
        </Button>
      </form>

      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
