import { BehaviorSubject, distinct, map, Observable, takeUntil, tap } from "rxjs";

type StateType<T extends string, Y> = {
    [key in T]: Y;
};

export class StateObservable<T_STATE_NAMES extends string, T_STATE_TYPES> {
    constructor(
        private readonly defaultValue: T_STATE_TYPES,
        private readonly destroyerObservable$?: Observable<void>
    ) {

    }

    private stateList$ = new BehaviorSubject<StateType<T_STATE_NAMES, T_STATE_TYPES>>({} as any);

    getValue(name: T_STATE_NAMES): T_STATE_TYPES {
        const result = this.stateList$.value[name];
        if (!result) {
            return this.defaultValue;
        }

        return result;
    }

    setValue(name: T_STATE_NAMES, newVal: T_STATE_TYPES): void {
        this.stateList$.next({ ...this.stateList$.value, [name]: newVal });
    }

    subscribeToState(stateName: T_STATE_NAMES): Observable<T_STATE_TYPES> {
        if (this.destroyerObservable$) {
            return this.stateList$.pipe(
                map(value => value[stateName] ?? this.defaultValue),
                distinct(),
                takeUntil(this.destroyerObservable$),
            );

        } else {
            return this.stateList$.pipe(
                map(value => value[stateName] ?? this.defaultValue),
                distinct(),
            );
        }
    }

    wrapState<T>(targetObservable: Observable<T>, stateName: T_STATE_NAMES, initialState: T_STATE_TYPES, finishedState: T_STATE_TYPES, errorState?: T_STATE_TYPES) {
        this.setValue(stateName, initialState);
        let isComplete = false;

        return targetObservable.pipe(
            tap({
                next: () => {
                    if (!isComplete) {
                        this.setValue(stateName, finishedState);
                        isComplete = true;
                    }
                },
                error: () => {
                    if (errorState) {
                        if (!isComplete) {
                            this.setValue(stateName, errorState);
                            isComplete = true;
                        }
                    }
                }
            })
        );
    }

    getPublicSubscriber() {
        return {
            subscribeToState: (state: T_STATE_NAMES) => this.subscribeToState(state)
        };
    }
}
