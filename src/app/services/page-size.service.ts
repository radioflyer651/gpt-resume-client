import { Injectable } from '@angular/core';
import { Observable, fromEvent, map, shareReplay, startWith } from 'rxjs';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { ComponentBase } from '../components/component-base/component-base.component';

@Injectable({
  providedIn: 'root'
})
export class PageSizeService extends ComponentBase {
  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    // Hook up to page-size changes so we can be responsive.
    this.pageResized$ = fromEvent(window, 'resize').pipe(
      map(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      })),
      startWith({
        width: window.innerWidth,
        height: window.innerHeight
      }),
      shareReplay(1)
    );

    // Subscribe to the page size service to enable handling of what to show, and how.
    this._isSkinnyPage = new ReadonlySubject(
      this.ngDestroy$,
      this.pageResized$.pipe(
      map(newSize => {
        return newSize.width < 1400;
      })
    ));

  }

  // #region isSkinnyPage
  private _isSkinnyPage!: ReadonlySubject<boolean>;

  /** Observable to emit whether or not we're too small to show the gutters
   *   of the page. */
  get isSkinnyPage$() {
    return this._isSkinnyPage.observable$;
  }

  get isSkinnyPage(): boolean {
    return this._isSkinnyPage.value;
  }
  // #endregion

  /** Observable that emits when the page is resized. */
  pageResized$!: Observable<{ width: number; height: number; }>;
}
