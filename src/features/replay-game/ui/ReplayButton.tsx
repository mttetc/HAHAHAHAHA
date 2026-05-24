type Props = {
  onReplay: () => void;
};

export function ReplayButton({ onReplay }: Props) {
  return (
    <button className="btn-play" onClick={onReplay}>
      HA HA HA HA HA (again)
    </button>
  );
}
