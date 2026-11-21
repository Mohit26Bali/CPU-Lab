/**
 * Shared parsing rules for the tiny assembly used by every module that lets a person type a program.
 * No React or DOM in here (it is part of the simulation core).
 */

export class AsmParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsmParseError";
  }
}

/** Limits that keep a typed program from freezing the page. */
export const MAX_PROGRAM_LINES = 64;
export const MAX_LINE_LENGTH = 80;
export const MAX_IMMEDIATE = 1_000_000;
export const MEMORY_WORDS = 16;
export const MAX_BRANCH_OFFSET = 64;

export type ParsedOperand =
  | { kind: "register"; name: string }
  | { kind: "immediate"; value: number }
  | { kind: "address"; value: number };

export type OperandKind = ParsedOperand["kind"];

export interface SourceLine {
  text: string;
  lineNumber: number;
}

/** Strips comments and blank lines, remembers original line numbers, and enforces the size limits. */
export function splitSource(source: string): SourceLine[] {
  const rawLines = source.split(/\r?\n/);
  if (rawLines.length > MAX_PROGRAM_LINES * 4) {
    throw new AsmParseError(`That is too long. Keep programs under ${MAX_PROGRAM_LINES} instructions.`);
  }
  const lines: SourceLine[] = [];
  rawLines.forEach((raw, i) => {
    const text = raw.split(";")[0].trim();
    if (!text) return;
    if (text.length > MAX_LINE_LENGTH) {
      throw new AsmParseError(`Line ${i + 1} is too long (the limit is ${MAX_LINE_LENGTH} characters).`);
    }
    lines.push({ text, lineNumber: i + 1 });
  });
  if (lines.length > MAX_PROGRAM_LINES) {
    throw new AsmParseError(`That is ${lines.length} instructions. The limit is ${MAX_PROGRAM_LINES}.`);
  }
  return lines;
}

function parseWholeNumber(text: string, what: string): number {
  if (!/^-?\d+$/.test(text)) {
    throw new AsmParseError(`${what} must be a whole number, but got "${text}".`);
  }
  return Number(text);
}

/** Parses one operand and checks that it is one of the kinds this slot accepts. */
export function parseOperand(token: string, allowed: OperandKind[], slot: string): ParsedOperand {
  const t = token.trim();
  if (t === "") throw new AsmParseError(`${slot} is missing.`);

  let operand: ParsedOperand;
  if (t.startsWith("#")) {
    const value = parseWholeNumber(t.slice(1), `The number in "${t}"`);
    if (Math.abs(value) > MAX_IMMEDIATE) {
      throw new AsmParseError(`"${t}" is too large. Use numbers between -${MAX_IMMEDIATE} and ${MAX_IMMEDIATE}.`);
    }
    operand = { kind: "immediate", value };
  } else if (t.startsWith("[") && t.endsWith("]")) {
    const value = parseWholeNumber(t.slice(1, -1).trim(), `The address in "${t}"`);
    if (value < 0 || value >= MEMORY_WORDS) {
      throw new AsmParseError(`Address ${value} does not exist. Memory has addresses 0 to ${MEMORY_WORDS - 1}.`);
    }
    operand = { kind: "address", value };
  } else if (/^R[0-7]$/i.test(t)) {
    operand = { kind: "register", name: t.toUpperCase() };
  } else {
    throw new AsmParseError(`"${t}" is not a register (R0 to R7), a number like #5, or an address like [0].`);
  }

  if (!allowed.includes(operand.kind)) {
    const names: Record<OperandKind, string> = { register: "a register like R1", immediate: "a number like #5", address: "an address like [0]" };
    throw new AsmParseError(`${slot} must be ${allowed.map((k) => names[k]).join(" or ")}, but got "${t}".`);
  }
  return operand;
}

export function splitOperands(rest: string, opcode: string, expected: number, example: string): string[] {
  const parts = rest.split(",").map((p) => p.trim());
  if (parts.length !== expected || parts.some((p) => p === "")) {
    throw new AsmParseError(`${opcode} needs ${expected} operands, like ${example}.`);
  }
  return parts;
}

/** Wraps an error from one line with its line number so the message says where the problem is. */
export function withLineNumber(error: unknown, line: SourceLine): never {
  const message = error instanceof Error ? error.message : "Could not read this line.";
  throw new AsmParseError(`Line ${line.lineNumber} ("${line.text}"): ${message}`);
}
