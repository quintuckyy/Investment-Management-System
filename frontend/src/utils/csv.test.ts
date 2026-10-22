import { describe, expect, it } from "vitest";
import {
  SAMPLE_CSV,
  buildPreview,
  escapeCsvValue,
  formatFileSize,
  parseCsvLine,
} from "./csv";

describe("parseCsvLine", () => {
  it("splits plain values and trims whitespace", () => {
    expect(parseCsvLine("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("keeps commas inside quoted values", () => {
    expect(parseCsvLine('1,DEPOSIT,10,"REF,1",COMPLETED')).toEqual([
      "1",
      "DEPOSIT",
      "10",
      "REF,1",
      "COMPLETED",
    ]);
  });

  it("handles escaped quotes and empty cells", () => {
    expect(parseCsvLine('"say ""hi""",,x')).toEqual(['say "hi"', "", "x"]);
  });
});

describe("buildPreview", () => {
  it("accepts the sample file", () => {
    const preview = buildPreview(SAMPLE_CSV);

    expect(preview.missingColumns).toEqual([]);
    expect(preview.totalRows).toBe(3);
    expect(preview.rows[0]).toEqual([
      "1",
      "DEPOSIT",
      "5000.00",
      "CSV-TXN-0001",
      "COMPLETED",
    ]);
  });

  it("lists missing required columns", () => {
    const preview = buildPreview("account_id,amount\n1,10");

    expect(preview.missingColumns).toEqual([
      "transaction_type",
      "reference_number",
      "status",
    ]);
  });

  it("ignores a byte-order mark and blank lines", () => {
    const preview = buildPreview(
      "﻿account_id,transaction_type,amount,reference_number,status\n\n1,DEPOSIT,5,R1,COMPLETED\n\n"
    );

    expect(preview.missingColumns).toEqual([]);
    expect(preview.totalRows).toBe(1);
  });

  it("limits the preview to a handful of rows but counts them all", () => {
    const rows = Array.from({ length: 20 }, (_, i) => `1,DEPOSIT,5,R${i},COMPLETED`);
    const preview = buildPreview(
      ["account_id,transaction_type,amount,reference_number,status", ...rows].join("\n")
    );

    expect(preview.rows).toHaveLength(5);
    expect(preview.totalRows).toBe(20);
  });

  it("treats an empty file as having every column missing", () => {
    expect(buildPreview("").missingColumns).toHaveLength(5);
  });
});

describe("helpers", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("quotes CSV values only when needed", () => {
    expect(escapeCsvValue("plain")).toBe("plain");
    expect(escapeCsvValue("a,b")).toBe('"a,b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
  });
});
