/**
 * Queue for storing streaming responses
 */
export class StreamingResponseQueue<T> {
  private queue: T[] = [];
  private waitResolve: ((value: T | null) => void) | null = null;
  private closed = false;

  /**
   * Check if the queue is closed
   *
   * @returns True if the queue is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Push an item to the queue
   *
   * @param item - Item to push
   * @returns True if the item was pushed successfully
   */
  push(item: T): boolean {
    if (this.closed) {
      return false;
    }

    if (this.waitResolve) {
      const resolve = this.waitResolve;
      this.waitResolve = null;
      resolve(item);
    } else {
      this.queue.push(item);
    }
    return true;
  }

  /**
   * Get the next item from the queue
   *
   * @returns Promise resolving to the next item or null if the queue is closed
   */
  async next(): Promise<T | null> {
    if (this.closed) {
      return null;
    }

    if (this.queue.length > 0) {
      return this.queue.shift() as T;
    }

    return new Promise<T | null>((resolve) => {
      this.waitResolve = resolve;
    });
  }

  /**
   * Close the queue
   */
  close(): void {
    this.closed = true;
    if (this.waitResolve) {
      this.waitResolve(null);
      this.waitResolve = null;
    }
  }

  /**
   * Create an async iterator for the queue
   *
   * @returns AsyncGenerator yielding items from the queue
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, unknown> {
    while (!this.closed || this.queue.length > 0) {
      const item = await this.next();
      if (item === null) {
        break;
      }
      yield item;
    }
  }
}
