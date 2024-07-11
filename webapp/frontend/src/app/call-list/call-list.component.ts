import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElasticsearchService } from "../elastic.service";
import { CommonModule } from '@angular/common';
import { SessionTreeComponent } from '../session-tree/session-tree.component';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule, SessionTreeComponent],
  template: `
    <button (click)="createCalls()">Create Calls</button>
    <div *ngFor="let call of callsList">
      <h3 (click)="toggleTree(call.id)">Call ID: {{ call.id }} (Click to toggle)</h3>
      <div *ngIf="callVisible[call.id]">
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

  constructor(private elasticsearchService: ElasticsearchService, private http: HttpClient) {}

  createCalls() {
    this.http.get('http://localhost:3000/calls/create').subscribe(
      (response: any) => {
        console.log('Calls created:', response);
        this.callsList = response.callsList;
        this.sessions = response.sessions;
      },
      error => console.error('Error creating calls:', error)
    );
  }

  toggleTree(callId: string) {
    this.callVisible[callId] = !this.callVisible[callId];
  }
}
