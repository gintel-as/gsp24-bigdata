import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SessionTreeComponent } from '../session-tree/session-tree.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule, SessionTreeComponent, SessionTreeComponent],
  template: `
    <button (click)="createCalls()">
      Create Calls
    </button>
    <div *ngFor="let call of callsList; let i = index" class="call-container">
      <h3 (click)="toggleTree(call.id)" class="call-header">Call ID: {{ call.id }} ({{ call.earliestTime }})</h3>
      <div *ngIf="callVisible[call.id]" class="session-tree-container">
        <p>Earliest event: {{ call.earliestTime }}</p>
        <p>Latest event: {{ call.latestTime }}</p>
        <app-session-tree [callsList]="callsList" [sessions]="sessions" [call]="call"></app-session-tree>
      </div>
    </div>
  `,
  styleUrls: ['./call-list.component.css']
})
export class CallListComponent {
  callsList: any[] = [];
  sessions: any[] = [];
  callVisible: { [key: string]: boolean } = {};

  constructor(private http: HttpClient) {}

  createCalls() {
    this.http.get('http://localhost:3000/calls/create').pipe(
      catchError(error => {
        console.error('Error creating calls:', error);
        return of({ callsList: [], sessions: [] });
      })
    ).subscribe(
      (response: any) => {
        console.log('Calls created:', response);
        this.callsList = response.callsList || [];
        this.sessions = response.sessions || [];
        this.sortCallsByEarliestTime();
        this.resetCallVisibility();
      }
    );
  }

  sortCallsByEarliestTime() {
    this.callsList.sort((a, b) => new Date(a.earliestTime).getTime() - new Date(b.earliestTime).getTime());
  }

  resetCallVisibility() {
    this.callVisible = {};
    this.callsList.forEach(call => {
      this.callVisible[call.id] = false;
    });
  }

  toggleTree(callId: string) {
    this.callVisible[callId] = !this.callVisible[callId];
  }
}
