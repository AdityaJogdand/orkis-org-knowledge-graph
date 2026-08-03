import orkisLogo from "../assets/orkis-orange.png";

export default function OrkisLogo({ size = "md" }) {
  const dims = size === "sm" ? "h-7" : "h-8";
  return (
    <div className="flex items-center gap-2">
      <img src={orkisLogo} alt="Orkis" className={`${dims} w-auto`} />
      <span className="text-lg font-display font-semibold text-orkis-dark tracking-tight">
        {/* <span className="not-italic">or</span> */}
        {/* <span className="italic">kis</span> */}
      </span>
    </div>
  );
}