interface SectionTitleProps {
  label?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export default function SectionTitle({
  label,
  title,
  description,
  align = "center",
}: SectionTitleProps) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto mb-14" : "mb-14"}>
      {label && (
        <span className="inline-block text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          {label}
        </span>
      )}
      <h2 className="text-navy text-3xl md:text-4xl font-serif font-medium leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-slate text-base mt-4 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
