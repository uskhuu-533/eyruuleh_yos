/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function BattlePage() {
  const [word, setWord] = useState("");
  const [status, setStatus] = useState<"waiting" | "playing" | "ended">("waiting");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // 📱 teamId унших
  useEffect(() => {
    setTeamId(localStorage.getItem("teamId"));
  }, []);

  // ⏳ Session + Countdown (ONE SOURCE OF TRUTH)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const syncSession = async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select("*")
        .single();

      if (!data?.is_active || !data.started_at) {
        setStatus("waiting");
        setTimeLeft(0);
        if (timer) clearInterval(timer);
        return;
      }

      const end =
        new Date(data.started_at).getTime() +
        data.duration * 1000;

      if (timer) clearInterval(timer);

      timer = setInterval(() => {
        const now = Date.now();
        const left = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(left);

        if (now >= end) {
          setStatus("ended");
          clearInterval(timer!);
        } else {
          setStatus("playing");
        }
      }, 1000);
    };

    syncSession();

    // realtime admin start/stop
    const channel = supabase
      .channel("session-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions" },
        syncSession
      )
      .subscribe();

    return () => {
      if (timer) clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // ✍️ Үг нэмэх
  const submit = useCallback(async () => {
    if (status !== "playing" || !word.trim()) return;
    if (!teamId) return alert("Баг олдсонгүй!");

    const { data: exists } = await supabase
      .from("euphemisms")
      .select("id")
      .eq("word", word.trim())
      .maybeSingle();

    if (exists) {
      alert("Давхардсан үг!");
      toast('Давхардсан үг!', {position:'top-center'})
      setWord("");
      return;
    }

    const { error } = await supabase.from("euphemisms").insert({
      word: word.trim(),
      team_id: teamId,
    });

    if (error) return alert("Алдаа гарлаа!");

    toast("амжилттай нэмэгдлээ", {position:"top-center"})
    setWord("");
  }, [status, word, teamId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">✍️ Эерүүлэх үг</h1>

      {status === "waiting" && (
        <p className="text-yellow-600">
          ⏳ Админ тоглоом эхлүүлэхийг хүлээж байна
        </p>
      )}

      {status === "playing" && (
        <p className="text-xl font-bold">
          ⏱️ Үлдсэн: {timeLeft}s
        </p>
      )}

      {status === "ended" && (
        <p className="text-red-600">⛔ Хугацаа дууссан</p>
      )}

      <input
        className="w-full border p-4 rounded text-lg"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="үгээ оруулна уу"
        disabled={status !== "playing"}
      />

      <button
        onClick={submit}
        disabled={status !== "playing" || !word.trim()}
        className="w-full bg-green-600 text-white p-4 rounded text-lg disabled:bg-gray-400"
      >
        Нэмэх ➕
      </button>
    </main>
  );
}