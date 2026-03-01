"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [teamName, setTeamName] = useState("");
  const [duration, setDuration] = useState(120);

  const addTeam = async () => {
    if (!teamName) return;
    await supabase.from("teams").insert({ name: teamName });
    setTeamName("");
  };

  
const startGame = async () => {
  const now = new Date();
const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  await supabase
    .from("game_sessions")
    .update({
      is_active: true,
      duration,
      started_at: utc8.toISOString(),
    })
    .eq("id", '151bea17-79a7-4dcd-b6a4-06e4ddd93f72');
};

  const stopGame = async () => {
    await supabase
      .from("game_sessions")
      .update({ is_active: false })
      .eq("id", "151bea17-79a7-4dcd-b6a4-06e4ddd93f72");
  };
  const clearGame = async () => {
    await supabase
    .from('game_sessions')
    .update({started_at:null})
    .eq("id", "151bea17-79a7-4dcd-b6a4-06e4ddd93f72")
  }
  
  
  return (
    <main className="p-10 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">🛠 Admin Panel</h1>

      <input
        placeholder="Багийн нэр"
        className="w-full border p-3 rounded"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />
      <button
        onClick={addTeam}
        className="w-full bg-black text-white p-3 rounded"
      >
        Баг нэмэх
      </button>

      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="w-full border p-3 rounded"
      />

      <button
        onClick={startGame}
        className="w-full bg-green-600 text-white p-3 rounded"
      >
        Start ⏱️
      </button>

      <button
        onClick={stopGame}
        className="w-full bg-red-600 text-white p-3 rounded"
      >
        Stop 🛑
      </button>

      <button onClick={clearGame} className="w-full bg-yellow-600 text-white p-3 rounded">Clear</button> 
    </main>
  );
}