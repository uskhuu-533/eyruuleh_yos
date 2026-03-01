/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Word = {
  id: string;
  word: string;
};

export default function TeamWordsPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [words, setWords] = useState<Word[]>([]);
  const [teamName, setTeamName] = useState("");

  const fetchData = async () => {
    // багийн нэр
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    if (team) setTeamName(team.name);

    // тухайн багийн үгс
    const { data: wordsData } = await supabase
      .from("euphemisms")
      .select("id, word")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    setWords(wordsData || []);
  };

  useEffect(() => {
    fetchData();

    // realtime update
    const channel = supabase
      .channel("team-words-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "euphemisms",
          filter: `team_id=eq.${teamId}`,
        },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);
const deleteWord = async (wordId: string) => {
  if (!confirm("Энэ үгийг устгах уу?")) return;

  const { error } = await supabase
    .from("euphemisms")
    .delete()
    .eq("id", wordId);

  if (error) {
    alert("Устгахад алдаа гарлаа");
  }
};
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        🏷 {teamName} — бичсэн үгс
      </h1>

      <div className="space-y-3">
        {words.map((w, i) => (
              <div
      key={w.id}
      className="flex items-center justify-between bg-gray-100 text-black rounded p-3"
    >
      <span>
        {i + 1}. {w.word}
      </span>

      <button
        onClick={() => deleteWord(w.id)}
        className="bg-red-600 text-white px-3 py-1 rounded"
      >
        Устгах
      </button>
    </div>
        ))}

        {words.length === 0 && (
          <p className="text-gray-400">
            Одоогоор үг нэмэгдээгүй байна
          </p>
        )}
      </div>
    </main>
  );
}