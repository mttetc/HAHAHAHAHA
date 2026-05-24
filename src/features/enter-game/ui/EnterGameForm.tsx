import { useState, type FormEvent } from "react";
import { primeAudioContext } from "@/shared/lib/audio";

const RANDOM_NAMES = [
  "Tidus", "Yuna", "Auron", "Rikku", "Wakka",
  "Lulu", "Kimahri", "Jecht", "Seymour", "Bahamut",
];

export function randomName() {
  const base = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  return base + Math.floor(Math.random() * 99 + 1);
}

type Props = {
  onPlay: (name: string) => void;
};

export function EnterGameForm({ onPlay }: Props) {
  const [name, setName] = useState(
    () => localStorage.getItem("playerName") ?? randomName()
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim() || randomName();
    localStorage.setItem("playerName", trimmed);
    primeAudioContext();
    onPlay(trimmed);
  }

  return (
    <form onSubmit={submit} className="menu-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={16}
        autoFocus
        className="name-input"
      />
      <button type="submit" className="btn-play">
        HA HA HA HA HA
      </button>
    </form>
  );
}
