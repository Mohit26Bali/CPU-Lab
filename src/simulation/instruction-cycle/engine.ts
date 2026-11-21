import type { BaseCycleSnapshot, SimulationEngine, Stage } from "@/types/simulation";
import type { Instruction, Operand } from "./isa";
import { REGISTER_NAMES } from "./isa";

const STAGES: Stage[] = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITEBACK"];
const MEMORY_SIZE = 16;

export interface InstructionCycleSnapshot extends BaseCycleSnapshot {
  pc: number;
  instructionIndex: number | null;
  instruction: Instruction | null;
  stage: Stage | null;
  registers: Record<string, number>;
  registersChanged: string[];
  memory: number[];
  memoryChanged: number[];
  controlSignals: Record<string, boolean>;
}

function readOperand(op: Operand, registers: Record<string, number>): number {
  if (op.kind === "immediate") return op.value;
  if (op.kind === "register") return registers[op.name] ?? 0;
  return op.value;
}

function cloneRegisters(registers: Record<string, number>): Record<string, number> {
  return { ...registers };
}

export class InstructionCycleEngine
  implements SimulationEngine<InstructionCycleSnapshot, Instruction[]>
{
  private instructions: Instruction[] = [];
  private registers: Record<string, number> = {};
  private memory: number[] = [];
  private pc = 0;
  private activeInstructionIndex: number | null = null;
  private cycleWithinInstruction = 0;
  private cycleCount = 0;
  private history: InstructionCycleSnapshot[] = [];
  /** ALU/memory scratch value produced by EXECUTE, consumed by MEMORY/WRITEBACK. */
  private aluResult = 0;
  private effectiveAddress = 0;

  initialize(program: Instruction[]): void {
    this.instructions = program;
    this.registers = Object.fromEntries(REGISTER_NAMES.map((r) => [r, 0]));
    this.memory = new Array(MEMORY_SIZE).fill(0);
    this.pc = 0;
    this.activeInstructionIndex = null;
    this.cycleWithinInstruction = 0;
    this.cycleCount = 0;
    this.history = [];
  }

  reset(): void {
    this.initialize(this.instructions);
  }

  getState(): InstructionCycleSnapshot {
    if (this.history.length === 0) {
      throw new Error("Engine has not ticked yet. Call tick() at least once.");
    }
    return this.history[this.history.length - 1];
  }

  getHistory(): InstructionCycleSnapshot[] {
    return this.history;
  }

  jumpToCycle(cycle: number): InstructionCycleSnapshot {
    if (cycle < 1 || cycle > this.history.length) {
      throw new Error(`Cycle ${cycle} out of range [1, ${this.history.length}]`);
    }
    return this.history[cycle - 1];
  }

  tick(): InstructionCycleSnapshot {
    this.cycleCount += 1;

    if (this.activeInstructionIndex === null) {
      if (this.pc >= this.instructions.length) {
        const snapshot: InstructionCycleSnapshot = {
          cycle: this.cycleCount,
          pc: this.pc,
          instructionIndex: null,
          instruction: null,
          stage: null,
          registers: cloneRegisters(this.registers),
          registersChanged: [],
          memory: [...this.memory],
          memoryChanged: [],
          controlSignals: {},
          events: [{ kind: "program-complete", message: "Program complete. No instructions remain." }],
          explanation: "All instructions have completed. The processor is idle.",
          isFinal: true,
        };
        this.history.push(snapshot);
        return snapshot;
      }
      this.activeInstructionIndex = this.pc;
      this.cycleWithinInstruction = 0;
    }

    const instruction = this.instructions[this.activeInstructionIndex];
    const stage = STAGES[this.cycleWithinInstruction];
    const registersChanged: string[] = [];
    const memoryChanged: number[] = [];
    const controlSignals: Record<string, boolean> = {};
    let explanation = "";

    switch (stage) {
      case "FETCH": {
        controlSignals.instructionMemoryRead = true;
        explanation = `Fetching "${instruction.raw}" from instruction memory at PC=${this.activeInstructionIndex}.`;
        break;
      }
      case "DECODE": {
        controlSignals.registerFileRead = true;
        explanation = `Decoding "${instruction.raw}": identifying opcode ${instruction.opcode} and reading source registers.`;
        break;
      }
      case "EXECUTE": {
        controlSignals.aluEnable = true;
        switch (instruction.opcode) {
          case "MOV":
            this.aluResult = readOperand(instruction.src1, this.registers);
            explanation = `ALU passes through value ${this.aluResult} for MOV.`;
            break;
          case "ADD":
            this.aluResult =
              readOperand(instruction.src1, this.registers) +
              readOperand(instruction.src2 as Operand, this.registers);
            explanation = `ALU computes ${readOperand(instruction.src1, this.registers)} + ${readOperand(
              instruction.src2 as Operand,
              this.registers,
            )} = ${this.aluResult}.`;
            break;
          case "SUB":
            this.aluResult =
              readOperand(instruction.src1, this.registers) -
              readOperand(instruction.src2 as Operand, this.registers);
            explanation = `ALU computes ${readOperand(instruction.src1, this.registers)} - ${readOperand(
              instruction.src2 as Operand,
              this.registers,
            )} = ${this.aluResult}.`;
            break;
          case "LOAD":
            // LOAD Rd, [addr]: the address is the source operand
            this.effectiveAddress = readOperand(instruction.src1, this.registers);
            explanation = `ALU computes effective address ${this.effectiveAddress}.`;
            break;
          case "STORE":
            // STORE Rs, [addr]: the address is the destination operand (the source is the register being stored)
            this.effectiveAddress = readOperand(instruction.dest, this.registers);
            explanation = `ALU computes effective address ${this.effectiveAddress}.`;
            break;
        }
        break;
      }
      case "MEMORY": {
        if (instruction.opcode === "LOAD") {
          controlSignals.memoryRead = true;
          this.aluResult = this.memory[this.effectiveAddress] ?? 0;
          explanation = `Reading memory[${this.effectiveAddress}] = ${this.aluResult}.`;
        } else if (instruction.opcode === "STORE") {
          controlSignals.memoryWrite = true;
          const value = readOperand(instruction.src1, this.registers);
          this.memory[this.effectiveAddress] = value;
          memoryChanged.push(this.effectiveAddress);
          explanation = `Writing ${value} to memory[${this.effectiveAddress}].`;
        } else {
          explanation = "No memory access needed for this instruction.";
        }
        break;
      }
      case "WRITEBACK": {
        if (instruction.opcode !== "STORE" && instruction.dest.kind === "register") {
          controlSignals.registerFileWrite = true;
          this.registers[instruction.dest.name] = this.aluResult;
          registersChanged.push(instruction.dest.name);
          explanation = `Writing ${this.aluResult} back to register ${instruction.dest.name}.`;
        } else {
          explanation = "No register write needed for this instruction.";
        }
        break;
      }
    }

    const snapshot: InstructionCycleSnapshot = {
      cycle: this.cycleCount,
      pc: this.activeInstructionIndex,
      instructionIndex: this.activeInstructionIndex,
      instruction,
      stage,
      registers: cloneRegisters(this.registers),
      registersChanged,
      memory: [...this.memory],
      memoryChanged,
      controlSignals,
      events: [{ kind: `stage-${stage.toLowerCase()}`, message: explanation }],
      explanation,
      isFinal: false,
    };
    this.history.push(snapshot);

    if (this.cycleWithinInstruction === STAGES.length - 1) {
      this.activeInstructionIndex = null;
      this.pc += 1;
      this.cycleWithinInstruction = 0;
    } else {
      this.cycleWithinInstruction += 1;
    }

    return snapshot;
  }
}
