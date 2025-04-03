import { Component } from '@angular/core';
import { PanelModule } from 'primeng/panel';
import { ComponentBase } from '../component-base/component-base.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user.service';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    PanelModule,
    InputTextModule,
    IftaLabelModule,
    ButtonModule,
    DialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends ComponentBase {
  constructor(
    readonly formBuilder: FormBuilder,
    readonly userService: UserService,
  ) {
    super();
  }

  loginForm!: FormGroup;

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      website: ['', [Validators.required, Validators.pattern(/(https?:\/\/)?(www\.)?([\w\d\-_])(\.[\w]{2,})/i)]]
    });
  }

  submit() {
    this.userService.login(this.loginForm.value);
  }

  /** Controls the help dialog box. */
  isHelpDialogVisible = false;

  showHelp() {
    this.isHelpDialogVisible = true;
  }

  closeInfo() {
    this.isHelpDialogVisible = false;
  }
}
