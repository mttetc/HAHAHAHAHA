import { primeAudioContext, startPrelude } from "@/shared/lib/audio";

type Props = {
  onReplay: () => void;
};

export function ReplayButton({ onReplay }: Props) {
  function handleClick() {
    primeAudioContext();
    startPrelude();
    onReplay();
  }
  return (
    <button className="btn-play" onClick={handleClick}>
      HA HA HA HA HA (again)
    </button>
  );
}
