import { Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlotSections } from '../plot-sections';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-plot-sections',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template:`
  <div class="plot-sections-container"> 
     <section class="plot-sections" [routerLink]="['/kibana', plotSection.id]" *ngIf="plotSection.id === 0">
      <img class="plot-photo" [src]="plotSection.photo">
      <h2 class="plot-name">{{plotSection.name}}</h2>
    </section>
    <section class="plot-sections" [routerLink]="['/log-merge', plotSection.id]" *ngIf="plotSection.id === 1">
      <img class="plot-photo" [src]="plotSection.photo">
      <h2 class="plot-name">{{plotSection.name}}</h2>
    </section>
    <section class="plot-sections" [routerLink]="['/call-list', plotSection.id]" *ngIf="plotSection.id === 2">
      <img class="plot-photo" [src]="plotSection.photo">
      <h2 class="plot-name">{{plotSection.name}}</h2>
    </section>
  </div>
  `,
  styleUrls: ['./plot-sections.component.css']
})
export class PlotSectionsComponent {
  @Input() plotSection!: PlotSections;
}


