import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { SessionTreeComponent } from '../session-tree/session-tree.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatInputModule, MatNativeDateModule, SessionTreeComponent],
  template: `
    <mat-form-field appearance="fill">
      <mat-label>Select Date</mat-label>
      <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate">
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
    <button (click)="createCalls()">
      Create Calls
    </button>
    <div *ngFor="let call of callsList; let i = index" class="call-container {{call.success}}">
      <h4 (click)="toggleTree(call.id)" class="call-header {{call.success}}">Call ID: {{ call.id }} ({{ convertCallTime(call.earliestTime) }})</h4>
      <div *ngIf="callVisible[call.id]" class="session-tree-container">
        <p>Earliest event: {{ convertCallTime(call.earliestTime) }}</p>
        <p>Latest event: {{ convertCallTime(call.latestTime) }}</p>
        <app-session-tree [callsList]="callsList" [sessions]="sessions" [call]="call" class="tree-box"></app-session-tree>
      </div>
    </div>
  `,
  styleUrls: ['./call-list.component.css']
})
export class CallListComponent {
  callsList: any[] = [];
  sessions: any[] = [];
  callVisible: { [key: string]: boolean } = {};
  selectedDate: Date | null = null;

  constructor(private http: HttpClient) {}

  createCalls() {
    const dateString = this.selectedDate ? this.formatDate(this.selectedDate) : '';
    this.http.get(`http://localhost:3000/calls/create?date=${dateString}`).pipe(
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

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  convertCallTime(time: string) {
    const date = new Date(time);

    const pad = (number: number) => number < 10 ? '0' + number : number;

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}
