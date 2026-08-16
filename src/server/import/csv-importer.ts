import type { SourceQuestion } from "./question-bank.schema";

/**
 * Expected CSV columns (header row required):
 *   id,question,option1,option2,option3,option4,correct_answer,explanation
 * Produces the same normalized shape as the JSON bank format so both paths
 * share one validator (question-bank.importer.ts) — CSV is just an
 * alternate transport, not a separate data model.
 */
export function parseQuestionBankCsv(csvText: string): SourceQuestion[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const idCol = col("id");
  const questionCol = col("question");
  const correctCol = col("correct_answer");
  const explanationCol = col("explanation");
  const optionCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^option\d+$/.test(h))
    .map(({ i }) => i);

  if (questionCol === -1 || correctCol === -1 || optionCols.length < 2) {
    throw new Error(
      "CSV must have at least: question, option1, option2, ..., correct_answer, explanation columns."
    );
  }

  return lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const options = optionCols.map((i) => coerceCell(cells[i] ?? ""));
    return {
      id: idCol !== -1 ? coerceCell(cells[idCol]) : rowIndex + 1,
      question: cells[questionCol]?.trim() ?? "",
      options,
      correct_answer: coerceCell(cells[correctCol] ?? ""),
      explanation: explanationCol !== -1 ? (cells[explanationCol]?.trim() ?? "") : "",
    };
  });
}

/** Numeric-looking cells become numbers (matching how the JSON bank stores numeric answers/options). */
function coerceCell(raw: string): string | number {
  const trimmed = raw.trim();
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

/** Minimal CSV line splitter supporting double-quoted fields with embedded commas. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
