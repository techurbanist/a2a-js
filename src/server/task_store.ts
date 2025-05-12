import { Task } from "../types/index.js";

/**
 * Interface for task storage
 */
export interface TaskStore {
  /**
   * Get a task by ID
   *
   * @param id - Task ID
   * @returns Promise resolving to the task or undefined if not found
   */
  get(id: string): Promise<Task | undefined>;

  /**
   * Save a task
   *
   * @param task - Task to save
   * @returns Promise that resolves when the task is saved
   */
  save(task: Task): Promise<void>;
}

/**
 * In-memory task store implementation
 */
export class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, Task> = new Map();

  /**
   * Get a task by ID
   *
   * @param id - Task ID
   * @returns Promise resolving to the task or undefined if not found
   */
  async get(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  /**
   * Save a task
   *
   * @param task - Task to save
   * @returns Promise that resolves when the task is saved
   */
  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }
}
