import { Component, Input } from '@angular/core';
import { ComponentBase } from '../component-base/component-base.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-comments-editor',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TextareaModule,
    TabsModule,
  ],
  templateUrl: './comments-editor.component.html',
  styleUrl: './comments-editor.component.scss'
})
export class CommentsEditorComponent extends ComponentBase {
  constructor() {
    super();
  }

  /** Gets or sets the target object that has comments. */
  @Input({ required: true })
  commentOwner!: { comments?: string[]; };

  private _selectedCommentIndex: number = 0;
  get selectedCommentIndex(): number {
    if (!this.commentOwner.comments) {
      return 0;
    }

    if (this.commentOwner.comments.length <= this._selectedCommentIndex) {
      this._selectedCommentIndex = this.commentOwner.comments.length - 1;
    }

    return this._selectedCommentIndex;
  }
  set selectedCommentIndex(value: number) {
    if (!this.commentOwner.comments) {
      this.commentOwner.comments = [];
    }

    this._selectedCommentIndex = value;
  }

  /** Returns a boolean value indicating whether or not the comment controls are editable.
   *   (if there's no comments, then it's not editable.)  */
  get isEditable(): boolean {
    return !!this.commentOwner.comments && this.commentOwner.comments.length > 0;
  }

  /** Gets the currently selected comment. */
  get selectedComment(): string {
    if (this.commentOwner.comments && this.commentOwner.comments.length < 1) {
      return '';
    }

    return this.commentOwner.comments?.[this.selectedCommentIndex] ?? '';
  }

  set selectedComment(newVal: string) {
    if (!this.commentOwner.comments) {
      this.commentOwner.comments = [];
    }

    this.commentOwner.comments[this.selectedCommentIndex] = newVal;
  }

  onCommentClicked(index: number): void {
    console.log(`Hi`);
    this.selectedCommentIndex = index;
  }

  deleteComment(): void {
    if (this.isEditable) {
      if (this.commentOwner.comments) {
        this.commentOwner.comments.splice(this.selectedCommentIndex, 1);
        this.selectedCommentIndex = 0;
      }
    }
  }

  newComment(): void {
    if (!this.commentOwner.comments) {
      this.commentOwner.comments = [''];
    } else {
      this.commentOwner.comments.push('');
      this.selectedCommentIndex = this.commentOwner.comments.length - 1;
    }
  }
}
