import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { logTypeMap } from '../log-map';

@Component({
  selector: 'app-log-merge',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, SearchbarComponent],
  templateUrl: './log-merge.component.html',
  styleUrls: ['./log-merge.component.css']
})
export class LogMergeComponent implements OnInit {
  filteredResults: any[] = [];
  paginatedLogs: any[] = [];
  currentPage: number = 1;
  pageSize: number = 100; 
  pageSizeOptions: number[] = [10, 20, 50, 100 , 250, 500];
  totalPages: number = 0;
  logTypes: string[] = []; 
  selectedTypes: { [key: string]: boolean } = {}; 
  isDropdownOpen: boolean = false; 

  constructor(private http: HttpClient, private eRef: ElementRef) { }

  ngOnInit(): void {
    this.calculatePageSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.calculatePageSize();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  calculatePageSize(): void {
    this.totalPages = Math.ceil(this.filteredResults.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.updatePaginatedLogs();
}

  updatePaginatedLogs(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLogs = this.filteredResults.slice(start, end);
    window.scrollTo( 0,0 );
  }

  onPageSizeChange(): void {
    this.pageSize = parseInt((document.getElementById('rowsPerPage') as HTMLSelectElement).value, 10);
    this.currentPage = 1; 
    this.calculatePageSize();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedLogs();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedLogs();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  handleFilteredResults(results: any[]) {
    this.filteredResults = results;
    this.currentPage = 1; 
    this.calculatePageSize();
  }

  getDisplayType(type: string): string {
    return logTypeMap.get(type) || type;
  }
}
