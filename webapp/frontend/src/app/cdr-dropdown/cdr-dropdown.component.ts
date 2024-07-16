import { Component, EventEmitter, Input, Output } from '@angular/core';
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-cdr-dropdown',
  standalone: true,
  templateUrl: './cdr-dropdown.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./cdr-dropdown.component.css']
})
export class CdrDropdownComponent {
  @Input() fields: string[] = [];
  @Input() label: string = '';  
  @Output() selectedFieldsChange = new EventEmitter<string[]>();

  selectedFields: string[] = [];

  toggleField(field: string) {
    const index = this.selectedFields.indexOf(field);
    if (index > -1) {
      this.selectedFields.splice(index, 1);
    } else {
      this.selectedFields.push(field);
    }
    this.selectedFieldsChange.emit(this.selectedFields);
  }

  isSelected(field: string): boolean {
    return this.selectedFields.includes(field);
  }
}
