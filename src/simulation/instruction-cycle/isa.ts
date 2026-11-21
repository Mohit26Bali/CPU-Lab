/**
 * Minimal ISA for Module 1 (Instruction Cycle). Deliberately small: enough
 * to demonstrate Fetch/Decode/Execute/Memory/Writeback without requiring
 * the learner to know a real assembly language.
 */

import {
  AsmParseError,
  parseOperand,
  splitOperands,
  splitSource,
  withLineNumber,
  type OperandKind,
} from "@/simulation/shared/asm";

export type Opcode = "MOV" | "ADD" | "SUB" | "LOAD" | "STORE";

export type Operand =
  | { kind: "register"; name: string }
  | { kind: "immediate"; value: number }
  | { kind: "address"; value: number };

export interface Instruction {
  raw: string;
  opcode: Opcode;
  dest: Operand;
  src1: Operand;
  src2?: Operand;
}

export const REGISTER_NAMES = ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"] as const;

export { AsmParseError };

/**
 * Parses tiny-assembly source into instructions. Every problem is reported with its line number, and numbers and
 * addresses are checked, so a typo can never become a silent NaN or an out-of-range memory write.
 *
 * Supported forms:
 *   MOV Rd, #imm | MOV Rd, Rs
 *   ADD Rd, Rs1, Rs2   (a number like #1 may replace a register)
 *   SUB Rd, Rs1, Rs2
 *   LOAD Rd, [addr]
 *   STORE Rs, [addr]
 */
export function parseProgram(source: string): Instruction[] {
  const lines = splitSource(source);
  const program: Instruction[] = lines.map((line) => {
    try {
      return parseLine(line.text);
    } catch (e) {
      return withLineNumber(e, line);
    }
  });
  return program;
}

const REG_OR_IMM: OperandKind[] = ["register", "immediate"];

function parseLine(line: string): Instruction {
  const match = line.match(/^([A-Za-z]+)\s+(.+)$/);
  if (!match) throw new AsmParseError("write an instruction name and its operands, like ADD R1, R2, R3.");
  const [, opRaw, operandsRaw] = match;
  const opcode = opRaw.toUpperCase();

  switch (opcode) {
    case "MOV": {
      const [d, s] = splitOperands(operandsRaw, "MOV", 2, "MOV R1, #5");
      return {
        raw: line,
        opcode,
        dest: parseOperand(d, ["register"], "The destination") as Operand,
        src1: parseOperand(s, REG_OR_IMM, "The source") as Operand,
      };
    }
    case "ADD":
    case "SUB": {
      const [d, a, b] = splitOperands(operandsRaw, opcode, 3, `${opcode} R1, R2, R3`);
      return {
        raw: line,
        opcode,
        dest: parseOperand(d, ["register"], "The destination") as Operand,
        src1: parseOperand(a, REG_OR_IMM, "The first source") as Operand,
        src2: parseOperand(b, REG_OR_IMM, "The second source") as Operand,
      };
    }
    case "LOAD": {
      const [d, a] = splitOperands(operandsRaw, "LOAD", 2, "LOAD R1, [0]");
      return {
        raw: line,
        opcode,
        dest: parseOperand(d, ["register"], "The destination") as Operand,
        src1: parseOperand(a, ["address"], "The memory address") as Operand,
      };
    }
    case "STORE": {
      const [s, a] = splitOperands(operandsRaw, "STORE", 2, "STORE R1, [0]");
      return {
        raw: line,
        opcode,
        dest: parseOperand(a, ["address"], "The memory address") as Operand,
        src1: parseOperand(s, REG_OR_IMM, "The value to store") as Operand,
      };
    }
    default:
      throw new AsmParseError(`"${opRaw}" is not an instruction here. Use MOV, ADD, SUB, LOAD or STORE.`);
  }
}

export const DEFAULT_PROGRAM = `MOV R1, #5
MOV R3, #10
ADD R2, R1, R3
SUB R4, R2, R1
STORE R4, [0]
LOAD R5, [0]`;
