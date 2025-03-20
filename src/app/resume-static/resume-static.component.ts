import { Component } from '@angular/core';

@Component({
  selector: 'app-resume-static',
  imports: [],
  templateUrl: './resume-static.component.html',
  styleUrl: './resume-static.component.scss',
  host: {
    'class': 'printable'
  }
})
export class ResumeStaticComponent {

}
