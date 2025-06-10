import { TableLazyLoadEvent } from "primeng/table";
import { PaginatedResult } from "../model/shared-models/paginated-result.model";
import { ReadonlySubject } from "./readonly-subject";
import { BehaviorSubject, Subject } from "rxjs";
import { LazyLoadMeta } from "primeng/api";


export class PaginationHelper<T> {
    constructor(readonly loadDataFunction: (lazyLoadMeta: LazyLoadMeta) => Promise<PaginatedResult<T>>) {

    }

    /** Tracks whether or not we've made our first call to load data. */
    private _initialLoadComplete = false;

    private _totalCount: number = 0;
    /** Returns the total number of records for this data set. */
    get totalCount(): number {
        return this._totalCount;
    }

    /** The sort properties of the last call. */
    lastLoadEvent!: LazyLoadMeta;

    protected compareObjects(v1: any, v2: any): boolean {
        const s1 = JSON.stringify(v1);
        const s2 = JSON.stringify(v2);
        return s1 === s2;
    }

    /** Given a skip/limit value set, returns a boolean value indicating whether or not
     *   data has to be loaded from the server for these.  (It might already be loaded). */
    private requiresLoad(skip: number, limit: number, lazyLoadMeta: LazyLoadMeta): boolean {
        if (!this._initialLoadComplete) {
            return true;
        }

        // If any data is missing, then we need to load it.
        for (let i = skip; i < skip + limit; i++) {
            if (!this._virtualData[i]) {
                return true;
            }
        }

        // Compare sorts criteria.
        if (!this.lastLoadEvent) {
            return true;
        }

        if (!this.compareObjects(this.lastLoadEvent.sortField, lazyLoadMeta.sortField) || this.lastLoadEvent.sortOrder !== lazyLoadMeta.sortField) {
            return true;
        }

        if (!this.compareObjects(this.lastLoadEvent.multiSortMeta, lazyLoadMeta.multiSortMeta)) {
            return true;
        }

        // All data looks like it's loaded!
        return false;
    }

    private clearVirtualData() {
        this._virtualData = [];
    }

    loadData = async (event: TableLazyLoadEvent): Promise<void> => {
        // Combine the last event and this one.  When sorting happens,
        //  It doesn't send the full event, but we need it to process our results.
        if (this.lastLoadEvent) {
            event = { ...this.lastLoadEvent, ...event } as any;
        }

        if (typeof event.first !== 'number' || typeof event.rows !== 'number') {
            throw new Error(`first and last must be provided.`);
        }

        let skip = event.first!;
        let limit = event.rows!;

        // Exit if we already have the required data loaded.
        if (!this.requiresLoad(skip, limit, event)) {
            return;
        }

        this.lastLoadEvent = event;

        // Indicate that we're loading data.
        this._isLoading.next(true);

        // Load the data.
        const result = await this.loadDataFunction(event);

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
    };

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

export type SortSpecification = undefined | string | string[];
export function normalizeSortSpecification(sortSpecification: SortSpecification): string[] {
    if (!sortSpecification) {
        return [];
    }

    if (typeof sortSpecification === 'string') {
        return [sortSpecification];
    }

    return sortSpecification;
}

export function compareSortValue(v1: SortSpecification, v2: SortSpecification): boolean {
    const s1 = normalizeSortSpecification(v1);
    const s2 = normalizeSortSpecification(v2);

    if (s1.length !== s2.length) {
        return false;
    }

    return s1.every((v, i) => s2[i] === v);
}