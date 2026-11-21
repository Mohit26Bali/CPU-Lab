/**
 * ISA for Module 3+ (Hazards, Forwarding, Branch Prediction). A superset of
 * the Module 1/2 ISA — adds BEQ so control hazards have something real to
 * resolve. Kept as its own file rather than extending instruction-cycle/isa.ts
 * so Module 1/2 stay untouched.
 */

import {
  AsmParseError,
  MAX_BRANCH_OFFSET,
  parseOperand,
  splitOperands,
  splitSource,
  withLineNumber,
  type OperandKind,
} from "@/simulation/shared/asm";

export type Opcode = "MOV" | "ADD" | "SUB" | "LOAD" | "STORE" | "BEQ";

export type Operand =
  | { kind: "register"; name: string }
  | { kind: "immediate"; value: number }
  | { kind: "address"; value: number };

export interface Instruction {
  raw: string;
  opcode: Opcode;
  /** Register written by this instruction. Absent for STORE and BEQ. */
  dest?: Operand;
  src1: Operand;
  src2?: Operand;
  /** BEQ only: instruction-count offset from the next instruction, taken if src1 == src2. */
  branchOffset?: number;
}

export const REGISTER_NAMES = ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"] as const;

/** Registers this instruction reads (used by the hazard detection unit). */
export function sourceRegisters(instr: Instruction): string[] {
  const regs: string[] = [];
  if (instr.src1.kind === "register") regs.push(instr.src1.name);
  if (instr.src2?.kind === "register") regs.push(instr.src2.name);
  return regs;
}

/** Register this instruction writes back, if any. */
export function destRegister(instr: Instruction): string | null {
  return instr.dest?.kind === "register" ? instr.dest.name : null;
}

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
 *   BEQ Rs, Rt, #offset      (offset counted in instructions from the next one)
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

  // A branch must land inside the program (or just past its end, which simply stops it).
  program.forEach((instr, index) => {
    if (instr.opcode !== "BEQ") return;
    const target = index + 1 + (instr.branchOffset ?? 0);
    if (target < 0 || target > program.length) {
      withLineNumber(
        new AsmParseError(`this branch would jump to instruction ${target}, but the program only has instructions 0 to ${program.length}.`),
        lines[index],
      );
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
    case "BEQ": {
      const [x, y, off] = splitOperands(operandsRaw, "BEQ", 3, "BEQ R1, R2, #2");
      const offset = parseOperand(off, ["immediate"], "The branch offset") as { kind: "immediate"; value: number };
      if (Math.abs(offset.value) > MAX_BRANCH_OFFSET) {
        throw new AsmParseError(`the branch offset must be between -${MAX_BRANCH_OFFSET} and ${MAX_BRANCH_OFFSET}.`);
      }
      return {
        raw: line,
        opcode,
        src1: parseOperand(x, REG_OR_IMM, "The first value") as Operand,
        src2: parseOperand(y, REG_OR_IMM, "The second value") as Operand,
        branchOffset: offset.value,
      };
    }
    default:
      throw new AsmParseError(`"${opRaw}" is not an instruction here. Use MOV, ADD, SUB, LOAD, STORE or BEQ.`);
  }
}

export const DATA_HAZARD_PROGRAM = `MOV R1, #5
MOV R3, #10
ADD R2, R1, R3
SUB R4, R2, R1`;

export const STRUCTURAL_HAZARD_PROGRAM = `MOV R1, #5
STORE R1, [0]
MOV R2, #1
MOV R3, #2
MOV R4, #3`;

export const CONTROL_HAZARD_PROGRAM = `MOV R1, #5
MOV R2, #5
BEQ R1, R2, #1
MOV R3, #99
MOV R4, #7
ADD R5, R4, R1`;
