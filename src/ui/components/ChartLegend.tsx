type Item = { label: string; color: string; dashed?: boolean }

export function ChartLegend({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-[12px] text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded"
            style={
              i.dashed
                ? { borderTop: `2px dashed ${i.color}`, height: 0 }
                : { background: i.color, height: 3 }
            }
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
