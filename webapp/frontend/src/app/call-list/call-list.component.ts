import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {ElasticsearchService} from "../elastic.service";

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [],
  template: `
    <button (click)="createCalls()">Create Calls</button>
  `,
  styleUrl: './call-list.component.css'
})
export class CallListComponent {

  constructor(private elasticsearchService: ElasticsearchService, private http: HttpClient) {}

  createCalls() {
    this.http.get('http://localhost:3000/calls/create').subscribe(
      response => console.log('Calls created:', response),
      error => console.error('Error creating calls:', error)
    );
  }
}
