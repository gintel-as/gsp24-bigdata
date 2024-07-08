import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {
  private apiUrl = 'http://localhost:3002';

  constructor(private http: HttpClient) {}

  search(index: string, field: string, query: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/search`, { index, field, query });
  }
}
