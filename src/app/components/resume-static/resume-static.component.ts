import { Component } from '@angular/core';
import { ComponentBase } from '../component-base/component-base.component';
import { UserService } from '../../services/user.service';
import { takeUntil } from 'rxjs';
import { SiteUser } from '../../../model/site-user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resume-static',
  imports: [
    CommonModule,
  ],
  templateUrl: './resume-static.component.html',
  styleUrl: './resume-static.component.scss',
  host: {
    'class': 'printable'
  }
})
export class ResumeStaticComponent extends ComponentBase {
  constructor(
    readonly usersService: UserService,
  ) {
    super();
  }

  ngOnInit() {
    this.usersService.user$.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe(user => {
      this.user = user;
    });
  }

  user?: SiteUser;

}
