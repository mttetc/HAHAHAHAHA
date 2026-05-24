import { primeAudioContext } from "@/shared/lib/audio";

type Props = {
  onReplay: () => void;
};

export function ReplayButton({ onReplay }: Props) {
  function handleClick() {
    primeAudioContext(); // resume AudioContext inside user gesture so iOS allows it
    onReplay();
  }
  return (
    <button className="btn-play" onClick={handleClick}>
      HA HA HA HA HA (again)
    </button>
  );
}
