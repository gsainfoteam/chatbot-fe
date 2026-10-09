export default function ChartTooltip(props: {
  active?: boolean;
  payload?: Array<unknown>;
  unit?: string;
}) {
  const { active, payload, unit = "" } = props;
  if (!active || !payload?.length) return null;
  const item = payload[0] as { value?: number; payload?: { fullDate?: string } };
  const value = item?.value ?? 0;
  const date = item?.payload?.fullDate ?? "";
  return (
    <div
      className="rounded-lg px-3 py-2.5 shadow-lg"
      style={{
        backgroundColor: "#1f2937",
        border: "none",
      }}
    >
      <div className="text-white text-sm font-medium">{date}</div>
      <div className="text-gray-400 text-xs mt-1">
        {value.toLocaleString()} {unit}
      </div>
    </div>
  );
}