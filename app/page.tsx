/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.from("teams").select("*").then(({ data }) => {
      setTeams(data || []);
    });
  }, []);

  const join = () => {
    if (!name || !teamId) return alert("Нэр ба багаа сонго!");
    localStorage.setItem("playerName", name);
    localStorage.setItem("teamId", teamId);
    router.push("/addwords")
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Багаа сонгох </h1>

      <input
        placeholder="Нэрээ бич"
        className="w-full border p-3 rounded text-lg"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select
        className="w-full border p-3 rounded text-lg"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      >
        <option value="">Баг сонгох</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <button
        onClick={join}
        className="w-full bg-blue-600 text-white p-3 rounded text-lg"
      >
        орох
      </button>
    </main>
  );
}