import { SlotLike } from './conflicts';

/**
 * Extension point for AI/constraint-solver timetable optimisation (e.g. OR-Tools CP-SAT or an LLM planner
 * validated by `findConflicts`). Implementations must return slots that pass conflict detection.
 */
export interface TimetableOptimizer {
  suggest(input: {
    offeringIds: string[];
    fixed: SlotLike[];
    availability: Record<string, { dayOfWeek: string; startMinute: number; endMinute: number }[]>;
  }): Promise<SlotLike[]>;
}
