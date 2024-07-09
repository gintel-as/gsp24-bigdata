import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="dropdown">
    <button class="dropbtn">
      {{ selectedItem || 'Select an option' }}
      <i class="fas fa-caret-down"></i>
    </button>
    <div class="dropdown-content">
      <a *ngFor="let item of dropdownItems" (click)="selectItem(item)">{{ item.name }}</a>
    </div>
  </div>
  `,
  styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent {
  dropdownItems: { name: string, url: string }[] = [
    { name: 'Discover', url: "http://localhost:5601/app/r/s/kJ19r"},
    { name: 'Barchart', url: 'http://localhost:5601/app/r/s/BnFti' },
    { name: 'Piechart', url: 'http://localhost:5601/app/r/s/OWXcd' }
  ];
  selectedItem: string = "";

  @Output() itemSelected = new EventEmitter<string>();

  constructor() {
    this.selectedItem = 'Select a dashboard';
  }

  selectItem(item: { name: string, url: string }) {
    this.selectedItem = item.name;
    this.itemSelected.emit(item.url);
  }
}
