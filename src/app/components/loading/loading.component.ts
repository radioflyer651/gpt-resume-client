import { Component } from '@angular/core';
import { ComponentBase } from '../component-base/component-base.component';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-loading',
  imports: [
    CommonModule,
    FormsModule,
    ProgressSpinnerModule,
    DialogModule,
  ],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent extends ComponentBase {
  constructor(
    readonly loadingService: LoadingService,
  ) {
    super();
  }

  ngOnInit() {
    this.showSpinner$ = this.loadingService.loadingState$.pipe(
      map(val => {
        return val === 'loading';
      }),
      startWith(false)
    );
  }

  showSpinner$!: Observable<boolean>;
}
