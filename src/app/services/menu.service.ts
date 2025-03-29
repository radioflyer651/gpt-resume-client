import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  constructor() { }

  private readonly _showMenu = new BehaviorSubject<boolean>(false);
  readonly showMenu$ = this._showMenu.asObservable();
  
  get showMenu(): boolean {
    return this._showMenu.getValue();
  }
  
  set showMenu(newVal: boolean) {
    this._showMenu.next(newVal);
  }
}
