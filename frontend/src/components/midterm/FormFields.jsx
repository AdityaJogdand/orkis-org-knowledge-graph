export function InlineSelect({ value, onChange, options, placeholder = "— pick —" }) {
  // If current value isn't in the options list, inject it so it still displays correctly
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[12px] text-stone-700 focus:outline-none cursor-pointer border-0"
    >
      <option value="">{placeholder}</option>
      {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function InlineDateInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={e => { e.target.type = "date"; }}
      onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
      placeholder="Pick date"
      className="w-full bg-transparent text-[12px] text-stone-700 focus:outline-none border-0 placeholder:text-stone-300"
    />
  );
}

export function FieldRow({ label, children, warn }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: warn ? "#FFF3E8" : "#F2EEE4" }}>
      <span className="text-[10px] font-semibold text-stone-400 w-16 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}