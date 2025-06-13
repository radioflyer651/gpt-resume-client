import { BehaviorSubject, fromEvent, Observable, Subject, takeUntil } from "rxjs";


export class RemainingSizeHelper {
    constructor(
        readonly targetElementSelector: string,
        readonly destructor$?: Observable<void>,
    ) {
        if (destructor$) {
            destructor$.subscribe(() => {
                this.onDestroy();
            });
        }

        this.initialize();
    }

    private resizeEvent$!: Observable<Event>;

    // #region remainingHeight
    private readonly _remainingHeight = new BehaviorSubject<number>(0);
    readonly remainingHeight$ = this._remainingHeight.asObservable();

    get remainingHeight(): number {
        return this._remainingHeight.getValue();
    }

    set remainingHeight(newVal: number) {
        this._remainingHeight.next(newVal);
    }
    // #endregion

    private destroy$ = new Subject<void>();

    private get element(): HTMLElement | null {
        return document.querySelector(this.targetElementSelector);
    }

    updateSize = () => {
        // Get the element.
        const element = this.element;

        // If not set, then we can't do anything.
        if (!element) {
            return;
        }

        // Get the top of the element to the bottom of the window.
        const elementPosition = element.offsetTop;
        const windowBottom = window.innerHeight;
        this.remainingHeight = windowBottom - elementPosition;
    };

    initialize() {
        this.resizeEvent$ = fromEvent(window, 'resize').pipe(
            takeUntil(this.destroy$)
        );

        this.resizeEvent$.subscribe(() => {
            this.updateSize();
        });

        setTimeout(() => {
            this.updateSize();
        }, 0);
    }

    onDestroy() {
        this.destroy$.next();
    }
}