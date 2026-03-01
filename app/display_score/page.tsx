/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Euphemism = {
  id: string;
  word: string;
};

type Team = {
  id: string;
  name: string;
  euphemisms: Euphemism[];
  score: number; // computed
};

export default function RankPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // 🧠 Teams + euphemisms fetch (оноо = length)
  const fetchTeams = async () => {
 const { data, error} = await supabase
  .from("teams")
  .select(`
    id,
    name,
    euphemisms!euphemisms_team_fk ( id, word )
  `);

    if (error) {
      console.error("Fetch teams error:", error);
      return;
    }

    const sorted: Team[] =
      data
        ?.map((team: any) => ({
          id: team.id,
          name: team.name,
          euphemisms: team.euphemisms || [],
          score: team.euphemisms?.length || 0,
        }))
        .sort((a, b) => b.score - a.score) || [];

    setTeams(sorted);
  };

  // ⏳ Countdown
  const startCountdown = (started_at: string, duration: number) => {
    const end =
      new Date(started_at).getTime() + duration * 1000;

    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((end - Date.now()) / 1000)
      );

      setTimeLeft(left);

      if (left === 0) {
        clearInterval(interval);
        setIsActive(false);
      }
    }, 1000);
  };

  // 🎮 Session fetch
  const fetchSession = async () => {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Session error:", error);
      return;
    }

    if (data?.is_active && data.started_at) {
      setIsActive(true);
      startCountdown(data.started_at, data.duration);
    } else {
      setIsActive(false);
      setTimeLeft(0);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchSession();

    // 🏆 team table realtime
    const teamChannel = supabase
      .channel("teams-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        fetchTeams
      )
      .subscribe();

    // 🔥 euphemisms нэмэгдэхэд scoreboard update
    const euphemismChannel = supabase
      .channel("euphemisms-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "euphemisms" },
        fetchTeams
      )
      .subscribe();

    // ⏳ session start/stop realtime
    const sessionChannel = supabase
      .channel("session-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions" },
        fetchSession
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(euphemismChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold text-center mb-6">
        🏆 Эерүүлэх Arena
      </h1>

      <h2 className="text-center text-3xl mb-10">
        ⏳ {timeLeft}s
      </h2>

      {/* 🧠 Flex row layout */}
      <div className="flex gap-8 justify-center items-start overflow-x-auto">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white/10 backdrop-blur rounded-xl p-6 min-w-[250px]"
          >
            <h2 className="text-2xl font-bold mb-2">
              {team.name}
            </h2>

            <p className="text-lg mb-4">
              ⭐ {team.score} оноо
            </p>

            {/* 📝 Бичсэн үгс */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {team.euphemisms?.map((w) => (
                <div
                  key={w.id}
                  className="bg-white/5 rounded px-3 py-1 text-sm"
                >
                  {w.word}
                </div>
              ))}

              {team.euphemisms?.length === 0 && (
                <div className="text-gray-400 text-sm">
                  Үг хараахан нэмэгдээгүй
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}