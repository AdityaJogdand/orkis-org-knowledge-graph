import { useRef } from "react";

export default function OtpInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;
    const newValue = value.split("");
    newValue[idx] = val[val.length - 1];
    onChange(newValue.join("").slice(0, length));
    if (idx < length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    onChange(pasted.slice(0, length));
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-10 h-12 text-center text-lg font-semibold border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-orkis-500/60 focus:border-transparent transition"
        />
      ))}
    </div>
  );
}