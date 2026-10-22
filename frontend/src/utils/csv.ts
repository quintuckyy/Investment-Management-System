export type Preview = {
  headers: string[];
  rows: string[][];
  totalRows: number;
  missingColumns: string[];
};

export const REQUIRED_COLUMNS = [
  {
    name: "account_id",
    description: "ID of an existing account",
    example: "1",
  },
  {
    name: "transaction_type",
    description: "DEPOSIT or WITHDRAWAL",
    example: "DEPOSIT",
  },
  {
    name: "amount",
    description: "Number greater than 0",
    example: "5000.00",
  },
  {
    name: "reference_number",
    description: "Unique reference per transaction",
    example: "CSV-TXN-0001",
  },
  {
    name: "status",
    description: "COMPLETED, PENDING or FAILED",
    example: "COMPLETED",
  },
];

export const SAMPLE_CSV = `account_id,transaction_type,amount,reference_number,status
1,DEPOSIT,5000.00,CSV-TXN-0001,COMPLETED
1,WITHDRAWAL,2000.00,CSV-TXN-0002,COMPLETED
2,DEPOSIT,10000.00,CSV-TXN-0003,COMPLETED`;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const PREVIEW_ROWS = 5;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function escapeCsvValue(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Split one CSV line into cells, honouring double-quoted values that contain commas. */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

/** Summarise CSV text for the preview table and check the header row. */
export function buildPreview(raw: string): Preview {
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const headers = parseCsvLine(lines[0] || "");
  const dataLines = lines.slice(1);

  return {
    headers,
    rows: dataLines.slice(0, PREVIEW_ROWS).map(parseCsvLine),
    totalRows: dataLines.length,
    missingColumns: REQUIRED_COLUMNS.map((column) => column.name).filter(
      (name) => !headers.includes(name)
    ),
  };
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
