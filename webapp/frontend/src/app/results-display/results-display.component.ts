import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h4>Results: {{ results.length }}</h4>
    </div>
    <!--<table class="log-table" *ngIf="results.length > 0">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Log Level</th>
          <th>Session ID</th>
          <th>Log Message</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let result of results" [ngStyle]="{'background-color': getBackgroundColor(result.source)}">
          <td>{{ result.timestamp }}</td>
          <td>{{ result.log_level }}</td>
          <td>{{ result.sessionID }}</td>
          <td>{{ result.log_message }}</td>
        </tr>
      </tbody>
    </table>-->
  `
})
export class ResultsDisplayComponent {
  @Input() results: any[] = [];
  @Input() getBackgroundColor!: (source: string) => string;
}
