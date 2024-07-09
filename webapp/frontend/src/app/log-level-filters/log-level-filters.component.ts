import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-log-level-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule],
  templateUrl: './log-level-filters.component.html',
  styleUrls: ['./log-level-filters.component.css']
})
export class LogLevelFiltersComponent {
  @Input() logLevels: string[] = [];
  @Input() selectedAdapterLogLevels: string[] = [];
  @Input() selectedServerLogLevels: string[] = [];
  @Input() selectedSIPLogLevels: string[] = [];
  @Output() filterChange = new EventEmitter<{ type: string, levels: string[] }>();

  onFilterChange(type: string, levels: string[]) {
    console.log(this.selectedAdapterLogLevels)
    this.filterChange.emit({ type, levels });
  }
}
