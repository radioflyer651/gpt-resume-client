import { Component, Input } from '@angular/core';
import { ComponentBase } from '../component-base/component-base.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { Comment } from '../../../model/shared-models/comments.model';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-comments-editor',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TextareaModule,
    TabsModule,
    FloatLabel,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './comments-editor.component.html',
  styleUrls: [
    './comments-editor.component.scss'
  ]
})
export class CommentsEditorComponent extends ComponentBase {
  constructor() {
    super();
  }

  /** Gets or sets the target object that has comments. */
  @Input({ required: true })
  commentOwner!: { comments?: Comment[]; };

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
    return !!this.commentOwner?.comments && this.commentOwner.comments.length > 0;
  }

  /** Gets the currently selected comment. */
  get selectedComment(): Comment | undefined {
    if (this.commentOwner?.comments && this.commentOwner.comments.length < 1) {
      return {
        title: 'New Comment',
        detail: ''
      };
    }

    return this.commentOwner?.comments?.[this.selectedCommentIndex];
  }

  set selectedComment(newVal: Comment) {
    if (!this.commentOwner.comments) {
      this.commentOwner.comments = [];
    }

    this.commentOwner.comments[this.selectedCommentIndex] = newVal;
  }

  onCommentClicked(index: number): void {
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
      this.commentOwner.comments = [{ title: 'New Comment', detail: '' }];
      this.selectedCommentIndex = 0;
    } else {
      this.commentOwner.comments.push({ title: 'New Comment', detail: '' });
      this.selectedCommentIndex = this.commentOwner.comments.length - 1;
    }
  }
}
