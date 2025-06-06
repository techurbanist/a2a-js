import { Task, Artifact } from "../types/index.js";

/**
 * Append an artifact to a task
 *
 * @param task - The task to update
 * @param artifact - The artifact to append
 * @returns Updated task
 */
export function appendArtifactToTask(task: Task, artifact: Artifact): Task {
  // Create a new task object to avoid mutating the original
  const updatedTask = {
    ...task,
    artifacts: [...(task.artifacts || []), { ...artifact, parts: artifact.parts || [] }],
    updatedAt: new Date().toISOString(),
  };

  return updatedTask;
}
