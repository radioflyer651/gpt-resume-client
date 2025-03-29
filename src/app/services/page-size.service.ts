import { Injectable } from '@angular/core';
import { Observable, fromEvent, map, shareReplay, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageSizeService {
  constructor() {
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
    this.skinnyPage$ = this.pageResized$.pipe(
      map(newSize => {
        return newSize.width < 1400;
      })
    );

  }

  /** Observable to emit whether or not we're too small to show the gutters
   *   of the page. */
  skinnyPage$!: Observable<boolean>;

  /** Observable that emits when the page is resized. */
  pageResized$!: Observable<{ width: number; height: number; }>;
}
