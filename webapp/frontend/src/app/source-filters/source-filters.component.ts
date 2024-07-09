import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-source-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-filters.component.html',
  styleUrls: ['./source-filters.component.css']
})
export class SourceFiltersComponent {
  @Input() showAdapterLogs: boolean = true;
  @Input() showServerLogs: boolean = true;
  @Input() showSIPLogs: boolean = true;
  @Input() showCDRLogs: boolean = true;
  @Output() sourceToggle = new EventEmitter<string>();

  toggleSource(source: string) {
    this.sourceToggle.emit(source);
  }
}
