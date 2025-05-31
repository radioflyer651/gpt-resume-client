import { TableLazyLoadEvent } from "primeng/table";
import { PaginatedResult } from "../model/shared-models/paginated-result.model";
import { ReadonlySubject } from "./readonly-subject";
import { BehaviorSubject, Subject } from "rxjs";


export class PaginationHelper<T> {
    constructor(readonly loadDataFunction: (skip: number, limit: number) => Promise<PaginatedResult<T>>) {

    }

    /** Tracks whether or not we've made our first call to load data. */
    private _initialLoadComplete = false;

    private _totalCount: number = 0;
    /** Returns the total number of records for this data set. */
    get totalCount(): number {
        return this._totalCount;
    }

    /** Given a skip/limit value set, returns a boolean value indicating whether or not
     *   data has to be loaded from the server for these.  (It might already be loaded). */
    private requiresLoad(skip: number, limit: number): boolean {
        if (!this._initialLoadComplete) {
            return true;
        }

        // If any data is missing, then we need to load it.
        for (let i = skip; i < skip + limit; i++) {
            if (!this._virtualData[i]) {
                return true;
            }
        }

        // All data looks like it's loaded!
        return false;
    }

    async loadData(skip: number, limit: number, event: TableLazyLoadEvent): Promise<void> {
        // Exit if we already have the required data loaded.
        if (!this.requiresLoad(skip, limit)) {
            return;
        }

        // Indicate that we're loading data.
        this._isLoading.next(true);

        // Load the data.
        const result = await this.loadDataFunction(skip, limit);

        // If this is the first time, we need to make room for the total data set.
        if (!this._initialLoadComplete) {
            this._virtualData = Array.from({ length: result.totalCount });
            this._totalCount = result.totalCount;
            this._initialLoadComplete = true;
        }

        // Set the data at the location in question.
        this._virtualData.splice(skip, result.data.length, ...result.data);

        // If we have an event to update the page, do so.
        if (event.forceUpdate) {
            event.forceUpdate();
        }

        // Indicate that we're done loading the data.
        this._isLoading.next(false);
    }

    // #region isLoading
    private readonly _isLoading = new BehaviorSubject<boolean>(false);

    /** Returns a boolean value indicating whether or not data is currently being loaded. */
    get isLoading$() {
        return this._isLoading.asObservable();
    }

    get isLoading(): boolean {
        return this._isLoading.value;
    }
    // #endregion


    private _virtualData: T[] = [];

    /** Returns the array containing the data from the server. */
    get virtualData(): T[] {
        return this._virtualData.slice();
    }
}