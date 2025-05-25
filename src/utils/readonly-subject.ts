import { BehaviorSubject, combineLatest, map, Observable, shareReplay, Subscription, takeUntil } from "rxjs";


export class ReadonlySubject<T> {
    constructor(takeUntilObservable: Observable<any>, source: Observable<T>) {
        if (takeUntil) {
            this.observable$ = source.pipe(takeUntil(takeUntilObservable), shareReplay({ bufferSize: 1, refCount: true }));
        } else {
            this.observable$ = source.pipe(shareReplay(1));
        }
    }

    /** Returns a shared  */
    readonly observable$: Observable<T>;

    get value(): T {
        // Temporarily subscribe to the observable to get the value asynchronously
        //  then unsubscribe and send the value.
        let returnValue!: T;
        let subscription: Subscription | undefined;

        try {
            subscription = this.observable$.subscribe(val => {
                returnValue = val;
            });

        } finally {
            subscription?.unsubscribe();
        }

        return returnValue;
    }
}
