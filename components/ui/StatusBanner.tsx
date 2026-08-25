const TONE: Record<string, string> = {
  error: "border-(--color-danger)/30 bg-(--color-danger)/10 text-(--color-danger)",
  success: "border-(--color-success)/30 bg-(--color-success)/10 text-(--color-success)",
};

/** Inline validation / status message for forms — one look for every error and confirmation. */
export function StatusBanner({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border p-3 text-sm ${TONE[tone]}`}
    >
      {children}
    </p>
  );
}
