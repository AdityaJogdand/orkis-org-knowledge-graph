import {
  CATEGORY_SHORT,
  categoryStyle,
} from "../../utils/theme";

export default function CategoryBadge({
  category,
}) {
  const style = categoryStyle(category);

  const label =
    CATEGORY_SHORT[category] ??
    category ??
    "Other";

  return (
    <span
      className="
        inline-flex
        items-center
        px-2.5
        py-1
        rounded-md
        whitespace-nowrap
        font-sans
        text-[8px]
        font-semibold
      "
      style={{
        background: style.bg,
        color: style.text,
      }}
    >
      {label}
    </span>
  );
}