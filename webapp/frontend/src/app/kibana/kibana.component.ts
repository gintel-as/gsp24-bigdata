import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; 
import { PlotSections } from '../plot-sections';
import { PlotMethodService } from '../plot-method.service';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-kibana',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  template: `
    <main>
      <section class="kibana-container">
        <app-dropdown (itemSelected)="onItemSelected($event)"></app-dropdown> 
        <iframe [src]="iframeSrc" class="kibana-iframe" ></iframe>
      </section>
    </main>
  `,
  styleUrls: ['./kibana.component.css']
})
export class KibanaComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  plotMethodService = inject(PlotMethodService);
  sanitizer: DomSanitizer = inject(DomSanitizer);
  plotSection: PlotSections | undefined;
  iframeSrc: SafeResourceUrl;

  constructor() {
    const plotSectionId = Number(this.route.snapshot.params["id"]);
    this.plotSection = this.plotMethodService.getPlotSectionById(plotSectionId); 
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl('http://localhost:5601/app/home#/');
  }

  onItemSelected(url: string) {
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
