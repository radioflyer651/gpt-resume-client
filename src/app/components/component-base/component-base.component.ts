import { Component } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-component-base',
  imports: [],
  template: ''
})
export class ComponentBase {

  private onDestroy = new Subject<void>();

  /** Emitted when ngOnDestroy is called.  Observables should pipe takeUntil 
   *   on this observable to automatically unsubscribe when the component is destroyed.  */
  protected ngDestroy$ = this.onDestroy.asObservable();

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
