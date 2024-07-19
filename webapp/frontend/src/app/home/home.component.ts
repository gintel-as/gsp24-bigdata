import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlotSectionsComponent } from '../plot-sections/plot-sections.component';
import { PlotSections } from '../plot-sections'
import { PlotMethodService } from '../plot-method.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PlotSectionsComponent, FileUploadComponent],
  template: `
    <section class="plot-sections">
      <app-plot-sections *ngFor="let plotSection of plotSectionList" [plotSection]="plotSection"></app-plot-sections>
      <app-file-upload></app-file-upload>
    </section>
  `,
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  plotSectionList: PlotSections[] = [];
  housingService: PlotMethodService = inject(PlotMethodService);

  constructor() {
    this.plotSectionList = this.housingService.getAllPlotSections();
  }
}
