import type { Task } from "./types";

/** Finished before today: it leaves its column for the Completed list. Done today stays put, crossed out. */
export const doneBefore = (t: Task, today: string) => t.done && (!t.doneOn || t.doneOn < today);
