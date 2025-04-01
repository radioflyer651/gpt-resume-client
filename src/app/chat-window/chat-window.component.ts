import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  imports: [
    CommonModule,
    FormsModule,
  ],
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements AfterViewInit {
  lines: string[] = [];
  input: string = '';
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  ngAfterViewInit() {
    this.focusInput();
  }

  focusInput() {
    this.hiddenInput.nativeElement.focus();
  }

  updateInput(event: Event) {
    this.input = (event.target as HTMLSpanElement).innerText;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.lines.push(this.input);
      this.input = '';
    } else if (event.key === 'Backspace') {
      if (this.input.length === 0 && this.lines.length > 0) {
        this.input = this.lines.pop()!;
      } else {
        this.input = this.input.slice(0, -1);
      }
    } else if (event.key.length === 1) {
      this.input += event.key;
    }
  }
}