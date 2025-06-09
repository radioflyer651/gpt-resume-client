import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LoadingStateTypes = 'not-loading' | 'loading';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  constructor() { }

  private loadingIds = new Set<string>();

  // #region loadingState
  private readonly _loadingState = new BehaviorSubject<LoadingStateTypes>('not-loading');
  readonly loadingState$ = this._loadingState.asObservable();

  /** Property that controls the loading state of the service. */
  get loadingState(): LoadingStateTypes {
    return this._loadingState.getValue();
  }

  set loadingState(newVal: LoadingStateTypes) {
    this._loadingState.next(newVal);
  }
  // #endregion

  /** Sets the state to "loading", and returns a unique string
   *   that must be supplied when loading is complete. */
  setLoading(): string {
    // Create the new ID.
    const id = this.createId();
    // Add it to the ID set to track.
    this.loadingIds.add(id);

    // Perform the actual update.
    this.setState('loading');

    // Return it.
    return id;
  }

  /** Sets the state to "not-loading", requiring the same ID string
   *   provided when the process set the state to "loading".  This accounts
   *   for when there are multiple processes loading. */
  setNotLoading(loadingId: string): void {
    // Ensure this ID is in the list.
    if (!this.loadingIds.has(loadingId)) {
      // We have problems - this shouldn't happen.
      throw new Error(`The loading ID ${loadingId} does not exist.`);
    }

    // Clear this ID from the list.
    this.loadingIds.delete(loadingId);

    // Set the state to not-loading.
    this.setState('not-loading');
  }

  /** Updates the current loadingState of the service.  This considers when multiple processes
   *   are currently loading, and only changes the state when it actually changes. */
  private setState(newState: LoadingStateTypes): void {
    if (newState === 'loading') {
      // If only 1, then we're changing from 0 to 1.  We need to update the sate.
      if (this.loadingIds.size === 1) {
        this.loadingState = 'loading';
      }
    } else if (newState === 'not-loading') {
      // Only worry about when the count is 0.
      if (this.loadingIds.size === 0) {
        this.loadingState = 'not-loading';
      }
    } else {
      // Always handle the unexpected state.
      throw new Error(`Unexpected loading state: ${newState}`);
    }
  }

  private createId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }


}
