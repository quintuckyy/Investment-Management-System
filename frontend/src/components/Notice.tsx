type NoticeProps = {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
};

const styles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

function Notice({ type, message, onDismiss }: NoticeProps) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${styles[type]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss message"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Notice;
