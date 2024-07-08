import { Component, Output, EventEmitter  } from '@angular/core';
import { ElasticsearchService } from '../elastic.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css']
})
export class SearchbarComponent {
  searchQuery: string = '';
  results: any[] = [];
  filteredResults: any[] = [];
  correlationIDs: string[] = [];
  showCorrelationLogs: boolean = false;

  logLevels: string[] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'];
  selectedLogLevels: string[] = this.logLevels.slice();

  showAdapterLogs: boolean = true;
  showServerLogs: boolean = true;
  showSIPLogs: boolean = true;
  removeFluff: boolean = false;

  @Output() filteredResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  constructor(private elasticsearchService: ElasticsearchService, private http: HttpClient) {}

  performSearch() {
    this.results = []; // Clear results before each search
    this.filteredResults = [];


    if (this.searchQuery.trim()) {
      // Fetch correlation IDs and perform another search if the checkbox is checked
      this.http.get<string[]>(`http://localhost:3002/correlation-ids/${this.searchQuery}`).subscribe(
        correlationIDs => {
          this.correlationIDs = correlationIDs.length ? correlationIDs : [this.searchQuery];
          if (this.showCorrelationLogs && this.correlationIDs.length > 0) {
            this.performCorrelationSearch();
          } else {
            this.searchLogs(this.searchQuery);
          }
        },
        error => {
          console.error('Error fetching correlation IDs', error);
          this.correlationIDs = [this.searchQuery];
          this.searchLogs(this.searchQuery);
        }
      );
    }
  }

  performCorrelationSearch() {
    if (this.correlationIDs.length > 0) {
      this.correlationIDs.forEach(correlationID => {
        this.searchLogs(correlationID);
      });
    }
  }

  searchLogs(query: string) {
    this.elasticsearchService.search('adapter_logs-2024.07.08', 'sessionID', query).subscribe(
      response => {
        this.processResults(response, 'adapter_logs');
      },
      error => {
        console.error('Error performing adapter log search', error);
      }
    );

    this.elasticsearchService.search('server_logs-2024.07.08', 'log_message', query).subscribe(
      response => {
        this.processResults(response, 'server_logs');
      },
      error => {
        console.error('Error performing server log search', error);
      }
    );

    this.elasticsearchService.search('sip_logs-2024.07.08', 'sessionID', query).subscribe(
      response => {
        this.processResults(response, 'sip_logs');
      },
      error => {
        console.error('Error performing SIP log search', error);
      }
    );
  }

  processResults(response: any, source: string) {
    const processedResults = response.map((result: any) => {
      const log = { ...result._source, source };

      // Extract sessionID for server_logs
      if (source === 'server_logs') {
        log.sessionID = this.extractSessionID(log.log_message);
      }

      return log;
    });

    this.results = [...this.results, ...processedResults];
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResults = this.results
      .filter(result => this.selectedLogLevels.includes(result.log_level))
      .filter(result =>
        (this.showAdapterLogs && result.source === 'adapter_logs') ||
        (this.showServerLogs && result.source === 'server_logs') ||
        (this.showSIPLogs && result.source === 'sip_logs') ||
        (this.showCorrelationLogs && result.source === 'correlation_logs'));

    if (this.removeFluff) {
      this.filteredResults = this.filteredResults.filter(result =>
        result.source !== 'adapter_logs' ||
        result.log_message.toLowerCase().includes('--->') ||
        result.log_message.toLowerCase().includes('<---')
      );
    }

    this.sortResultsByTimestamp();
    this.filteredResultsChange.emit(this.filteredResults);
  }

  sortResultsByTimestamp() {
    this.filteredResults.sort((a, b) => new Date(a.time_parsed).getTime() - new Date(b.time_parsed).getTime());
  }

  toggleLogLevel(level: string) {
    if (this.selectedLogLevels.includes(level)) {
      this.selectedLogLevels = this.selectedLogLevels.filter(l => l !== level);
    } else {
      this.selectedLogLevels.push(level);
    }
    this.applyFilters();
  }

  toggleSource(source: string) {
    if (source === 'adapter') {
      this.showAdapterLogs = !this.showAdapterLogs;
    } else if (source === 'server') {
      this.showServerLogs = !this.showServerLogs;
    } else if (source === 'sip') {
      this.showSIPLogs = !this.showSIPLogs;
    }
    this.applyFilters();
  }

  toggleRemoveFluff() {
    this.removeFluff = !this.removeFluff;
    this.applyFilters();
  }

  toggleCorrelationLogs() {
    this.showCorrelationLogs = !this.showCorrelationLogs;
    this.results = []; // Clear results when toggling
    this.filteredResults = [];

    if (this.showCorrelationLogs && this.correlationIDs.length > 0) {
      this.performCorrelationSearch();
    } else {
      this.performSearch();
    }
  }

  getBackgroundColor(source: string): string {
    switch (source) {
      case 'adapter_logs':
        return '#e0f7fa';
      case 'server_logs':
        return '#ffecb3';
      case 'sip_logs':
        return '#c8e6c9';
      default:
        return 'white';
    }
  }

  extractSessionID(logMessage: string): string {
    const match = logMessage.match(/callId\s*=\s*'?(\d+)'?/i);
    return match ? match[1] : '';
  }
}
