import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SessionTreeComponent } from '../session-tree/session-tree.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule, SessionTreeComponent],
  template: `
    <button (click)="createCalls()">
      {{ isLoading ? 'Creating Calls... ' : 'Create Calls' }}
      <div
        *ngIf="isLoading"
        class="spinner"
        style="display: inline-block;"
      ></div>
    </button>
    <div *ngIf="!isLoading" class="container">
      <div
        *ngFor="let call of callsList; let i = index"
        class="call-container {{ call.success }}"
      >
        <h4
          (click)="toggleTree(call.id)"
          class="call-header {{ call.success }}"
        >
          Call ID: {{ call.id }} ({{ convertCallTime(call.earliestTime) }})
        </h4>
        <div *ngIf="callVisible[call.id]" class="session-tree-container">
          <p>Earliest event: {{ convertCallTime(call.earliestTime) }}</p>
          <p>Latest event: {{ convertCallTime(call.latestTime) }}</p>
          <app-session-tree
            [callsList]="callsList"
            [sessions]="sessions"
            [call]="call"
            class="tree-box"
          ></app-session-tree>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./call-list.component.css'],
})
export class CallListComponent {
  callsList: any[] = [];
  sessions: any[] = [];
  callVisible: { [key: string]: boolean } = {};
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  createCalls() {
    this.isLoading = true;
    this.http
      .get('http://localhost:3000/calls/create')
      .pipe(
        catchError((error) => {
          console.error('Error creating calls:', error);
          this.isLoading = false;
          return of({ callsList: [], sessions: [] });
        })
      )
      .subscribe((response: any) => {
        console.log('Calls created:', response);
        this.callsList = response.callsList || [];
        this.sessions = response.sessions || [];
        this.sortCallsByEarliestTime();
        this.resetCallVisibility();
        this.isLoading = false;
      });
  }

  sortCallsByEarliestTime() {
    this.callsList.sort(
      (a, b) =>
        new Date(a.earliestTime).getTime() - new Date(b.earliestTime).getTime()
    );
  }

  resetCallVisibility() {
    this.callVisible = {};
    this.callsList.forEach((call) => {
      this.callVisible[call.id] = false;
    });
  }

  toggleTree(callId: string) {
    this.callVisible[callId] = !this.callVisible[callId];
  }

  convertCallTime(time: string) {
    const date = new Date(time);

    const pad = (number: number) => (number < 10 ? '0' + number : number);

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}
