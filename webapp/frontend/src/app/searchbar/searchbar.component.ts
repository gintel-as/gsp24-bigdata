import {Component, EventEmitter, Output} from '@angular/core';
import { ElasticsearchService } from '../elastic.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SearchInputComponent } from '../search-input/search-input.component';
import { LogLevelFiltersComponent } from '../log-level-filters/log-level-filters.component';
import { SourceFiltersComponent } from '../source-filters/source-filters.component';
import { ResultsDisplayComponent } from '../results-display/results-display.component';
import { SessionTreeComponent } from '../session-tree/session-tree.component';
import { CdrDropdownComponent } from '../cdr-dropdown/cdr-dropdown.component';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    SearchInputComponent,
    LogLevelFiltersComponent,
    SourceFiltersComponent,
    ResultsDisplayComponent,
    SessionTreeComponent,
    CdrDropdownComponent
  ],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css']
})
export class SearchbarComponent {
  searchQuery: string = '';
  results: any[] = [];
  filteredResults: any[] = [];
  incomingEvents: { currentSessionId: string, retriggeredFromSessionId: string, serviceKey: string }[] = [];
  correlationIDs: Set<string> = new Set();
  showCorrelationLogs: boolean = false;

  logLevels: string[] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'];
  selectedAdapterLogLevels: string[] = [...this.logLevels];
  selectedServerLogLevels: string[] = [...this.logLevels];
  selectedSIPLogLevels: string[] = [...this.logLevels];

  showAdapterLogs: boolean = true;
  showServerLogs: boolean = true;
  showSIPLogs: boolean = true;
  showCDRLogs: boolean = true;
  showEDRLogs: boolean = true; 
  removeFluff: boolean = false;
  removeCSTAFluff: boolean = false;

  fields: string[] = [
    "callType", "sessionID", "correlationID", "sequenceNumber", "aNumber",
    "dialledNumber", "cNumber", "servedUser", "servedUserLogin",
    "redirectNumber", "redirectNumberClir", "originallyCalledNumber",
    "originallyCalledNumberClir", "genericNumber", "genericNumberDisplayed",
    "hasClir", "callStartTime", "overheadTime", "pagingTime", "ringingTime",
    "conversationStartTime", "connectTime", "chargeClass", "chargeParty",
    "agentOrgName", "agentLogin", "agentNumber", "mscAddress", "vlrNumber",
    "vpnScenario", "oname", "serviceKey", "pani", "serviceId",
    "serviceProvider", "generatedPani", "prefix", "postfix", "serviceType",
    "originatingTerminalNumber", "counterPartyOname", "twoStepLeg2AnswerTime",
    "counterPartyId", "twoStepLeg2Number", "servedUserPrimary"
  ];

  edrFields: string[] =  [
    "record_type", "callType", "id", "sessionID", "sequenceNumber", "aNumber", 
    "bNumber", "cNumber", "servedUser", "redirectNumber", "genericNumber", "a_clir", 
    "term_code", "callStartTime", "mrfAnswerTime", "overheadTime", "pagingTime", "ringingTime", 
    "calledPartyAnswerTime", "connectTime", "chargeClass", "payingParty", 
    "release_code", "mscAddress", "vlrAddress", "transferCapability", "layer1Capability", 
    "vpnScenario", "aProvider", "cProvider", "sno", "cid", 
    "oname", "userResponseHistory", "serviceKey", "subServiceId", "edrType", 
    "operation", "serviceProvider", "noConnectCause", 
    "cellGlobalId", "pani", "generatedPani", "usedLocation", "sipCause", "pcv"
  ];

  selectedFields: string[] = [];
  selectedEdrFields: string[] = [];
  searchTerms: { log: string, term: string }[] = [];

  showMenu: boolean = false;
  selectedLog: string = '';
  searchTerm: string = '';

  @Output() filteredResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  constructor(private elasticsearchService: ElasticsearchService, private http: HttpClient) {}

  onSearch(query: string) {
    this.searchQuery = query;
    this.performSearch();
  }

  onSelectedCdrFieldsChange(selectedFields: string[]) {
    this.selectedFields = selectedFields;
    this.updateLogMessages();
  }
  onSelectedEdrFieldsChange(selectedEdrFields: string[]) {
    this.selectedEdrFields = selectedEdrFields;
    this.updateLogMessages();
  }

  updateLogMessages() {
    this.results.forEach(log => {
      if (log.source === 'cdr_logs') {
        log.log_message = this.selectedFields.map(field => `${field} = ${log[field]}`).join(', ');
      }
      if (log.source === 'edr_logs') {
        log.log_message = this.selectedEdrFields.map(field => `${field} = ${log[field]}`).join(', ');
      }
    });
    this.applyFilters();
  }

  performSearch() {
    this.results = []; // Clear results before each search
    this.filteredResults = [];
    this.incomingEvents = [];
    this.correlationIDs.clear();

    if (this.searchQuery.trim()) {
      // Fetch correlation IDs and perform another search if the checkbox is checked
      this.http.get<{ currentSessionId: string, retriggeredFromSessionId: string, serviceKey: string }[]>(
        `http://localhost:3000/correlation-ids/${this.searchQuery}`
      ).subscribe(
        data => {
          this.incomingEvents = data;
          data.forEach(result => {
            this.correlationIDs.add(result.currentSessionId);
            this.correlationIDs.add(result.retriggeredFromSessionId);
            console.log(this.correlationIDs)
          });
          if (this.showCorrelationLogs && this.correlationIDs.size > 0) {
            this.performCorrelationSearch();
          } else {
            this.searchLogs(this.searchQuery);
          }
        },
        error => {
          console.error('Error fetching correlation IDs', error);
          this.correlationIDs.add(this.searchQuery);
          this.searchLogs(this.searchQuery);
        }
      );
    }
  }

  performCorrelationSearch() {
    console.log("correlation IDs" + this.correlationIDs)
    if (this.correlationIDs.size > 0) {
      Array.from(this.correlationIDs).forEach(correlationID => {
        this.searchLogs(correlationID);
      });
    }
  }

  searchLogs(query: string) {
    this.elasticsearchService.search('adapter_logs', 'sessionID', query).subscribe(
      response => {
        this.processResults(response, 'adapter_logs');
      },
      error => {
        console.error('Error performing adapter log search', error);
      }
    );

    this.elasticsearchService.search('adapter_logs', 'log_message', query).subscribe(
      response => {
        this.processResults(response, 'adapter_logs');
      },
      error => {
        console.error('Error performing adapter log search', error);
      }
    );

    this.elasticsearchService.search('server_logs', 'log_message', query).subscribe(
      response => {
        this.processResults(response, 'server_logs');
      },
      error => {
        console.error('Error performing server log search', error);
      }
    );

    this.elasticsearchService.search('sip_logs', 'sessionID', query).subscribe(
      response => {
        this.processResults(response, 'sip_logs');
      },
      error => {
        console.error('Error performing SIP log search', error);
      }
    );

    this.elasticsearchService.search('cdr_logs', 'sessionID', query).subscribe(
      response => {
        this.processResults(response, 'cdr_logs');
      },
      error => {
        console.error('Error performing CDR log search', error);
      }
    );

    this.elasticsearchService.search('edr_logs', 'sessionID', query).subscribe(  
      response => {
        this.processResults(response, 'edr_logs'); 
      },
      error => {
        console.error('Error performing EDR log search', error);  
      }
    );
  }

  onFilterChange(event: { type: string, levels: string[] }) {
    if (event.type === 'adapter') {
      this.selectedAdapterLogLevels = event.levels;
    } else if (event.type === 'server') {
      this.selectedServerLogLevels = event.levels;
    } else if (event.type === 'sip') {
      this.selectedSIPLogLevels = event.levels;
    }
    this.applyFilters();
  }

  formatDateString(isoString: string): string {
    const date = new Date(isoString);

    // Extract the parts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Combine the parts into the desired format
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  processResults(response: any, source: string) {
    const processedResults = response.map((result: any) => {
      const log = { ...result._source, source };

      // Extract sessionID for server_logs
      if (source === 'server_logs') {
        log.sessionID = this.extractSessionID(log.log_message);
      } else if (source === 'cdr_logs' || source === 'edr_logs') {
        log.timestamp = this.formatDateString(log.callEndTime);
        log.time_parsed = log.callEndTime;
        log.log_message = this.selectedFields.map(field => `${field} = ${log[field]}`).join(', ');
      }

      return log;
    });

    this.results = [...this.results, ...processedResults];
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResults = this.results
      .filter(result => {
        if (result.source === 'adapter_logs') {
          return this.selectedAdapterLogLevels.includes(result.log_level);
        } else if (result.source === 'server_logs') {
          return this.selectedServerLogLevels.includes(result.log_level);
        } else if (result.source === 'sip_logs') {
          return this.selectedSIPLogLevels.includes(result.log_level);
        }
        return true;
      })
      .filter(result =>
        (this.showAdapterLogs && result.source === 'adapter_logs') ||
        (this.showServerLogs && result.source === 'server_logs') ||
        (this.showSIPLogs && result.source === 'sip_logs') ||
        (this.showCDRLogs && result.source === 'cdr_logs') ||
        (this.showEDRLogs && result.source === 'edr_logs') || 
        (this.showCorrelationLogs && result.source === 'correlation_logs'))
      .filter(result => {
        return this.searchTerms.every(term => {
          return result.source !== term.log || result.log_message.includes(term.term);
        });
      });

    if (this.removeFluff) {
      this.filteredResults = this.filteredResults.filter(result =>
        result.source !== 'adapter_logs' ||
        result.log_message.toLowerCase().includes('--->') ||
        result.log_message.toLowerCase().includes('<---')
      );
    }
    if (this.removeCSTAFluff) {
      this.filteredResults = this.filteredResults.filter(result =>
        result.source !== 'server_logs' ||
        result.log_message.toLowerCase().includes('pushevent'));
    }

    this.sortResultsByTimestamp();
    this.filteredResultsChange.emit(this.filteredResults);
  }

  sortResultsByTimestamp() {
    this.filteredResults.sort((a, b) => new Date(a.time_parsed).getTime() - new Date(b.time_parsed).getTime());
  }

  toggleSource(source: string) {
    if (source === 'adapter') {
      this.showAdapterLogs = !this.showAdapterLogs;
    } else if (source === 'server') {
      this.showServerLogs = !this.showServerLogs;
    } else if (source === 'sip') {
      this.showSIPLogs = !this.showSIPLogs;
    } else if (source === 'cdr') {
      this.showCDRLogs = !this.showCDRLogs;
    } else if (source === 'edr') {  
      this.showEDRLogs = !this.showEDRLogs;  
    }
    this.applyFilters();
  }

  toggleRemoveFluff() {
    this.removeFluff = !this.removeFluff;
    this.applyFilters();
  }

  toggleRemoveCSTAFluff() {
    this.removeCSTAFluff = !this.removeCSTAFluff;
    this.applyFilters();
  }

  toggleCorrelationLogs() {
    this.showCorrelationLogs = !this.showCorrelationLogs;
    this.results = []; // Clear results when toggling
    this.filteredResults = [];

    if (this.showCorrelationLogs && this.correlationIDs.size > 0) {
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
      case 'cdr_logs':
        return '#FF7F7F';
      default:
        return 'white';
    }
  }

  extractSessionID(logMessage: string): string {
    const match = logMessage.match(/callId\s*=\s*'?(\d+)'?/i);
    return match ? match[1] : '';
  }

  addSearchTerm(log: string, term: string) {
    this.searchTerms.push({ log, term });
    this.applyFilters()
  }

  removeSearchTerm(index: number) {
    this.searchTerms.splice(index, 1);
    this.applyFilters()
  }
}
