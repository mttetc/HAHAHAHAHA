import { EnterGameForm } from "@/features/enter-game";

type Props = {
  onPlay: (name: string) => void;
};

export function Menu({ onPlay }: Props) {
  return (
    <div className="screen menu-screen">
      <EnterGameForm onPlay={onPlay} />
    </div>
  );
}
