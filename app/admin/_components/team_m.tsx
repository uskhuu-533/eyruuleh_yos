"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
};

export default function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const fetchTeams = async () => {
    const { data, error } = await supabase.from("teams").select("id, name");

    if (error) {
      console.error(error);
      return;
    }

    setTeams(data || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeams();

    const channel = supabase
      .channel("admin-teams-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        fetchTeams,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setNewName(team.name);
  };

  const saveEdit = async () => {
    if (!editingId || !newName.trim()) return;

    await supabase
      .from("teams")
      .update({ name: newName.trim() })
      .eq("id", editingId);

    setEditingId(null);
    setNewName("");
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Энэ багийг устгах уу?")) return;

    await supabase.from("teams").delete().eq("id", id);
  };

  return (
    <div className="bg-white/10 rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-bold">👥 Багууд</h2>

      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center justify-between bg-white/5 p-3 rounded"
        >
          {editingId === team.id ? (
            <input
              className="border p-2 rounded text-black w-full mr-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          ) : (
            <Link href={`/admin/team/${team.id}`}>
              <span className="font-medium hover:underline cursor-pointer">
                {team.name}
              </span>
            </Link>
          )}

          <div className="flex gap-2">
            {editingId === team.id ? (
              <>
                <button
                  onClick={saveEdit}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Хадгалах
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  Болих
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startEdit(team)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Засах
                </button>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Устгах
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {teams.length === 0 && (
        <p className="text-gray-400">Баг одоогоор байхгүй байна</p>
      )}
    </div>
  );
}
