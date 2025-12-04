import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface DialogData {
  expertName: string;
}

@Component({
  selector: 'app-quote-request-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './quote-request-dialog.html',
  styleUrl: './quote-request-dialog.scss',
})
export class QuoteRequestDialog {
  description: string = '';
  contactEmail: string = '';

  constructor(
    public dialogRef: MatDialogRef<QuoteRequestDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    console.log('Quote requested:', {
      expert: this.data.expertName,
      description: this.description,
      email: this.contactEmail
    });
    this.dialogRef.close(true);
  }
}
