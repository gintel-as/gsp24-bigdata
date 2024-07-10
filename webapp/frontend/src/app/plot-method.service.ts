import { Injectable } from '@angular/core';
import { PlotSections } from './plot-sections';

@Injectable({
  providedIn: 'root'
})
export class PlotMethodService {
  protected plotSectionList: PlotSections[] = [
    {
      "name": "Kibana",
      "photo": "assets/kibana_logo.png",
      "id"  : 0
    },
    {
      "name": "Logs",
      "photo": "assets/logs.png",
      "id"  : 1
    },
    {
      "name": "Call List",
      "photo": "assets/call_list_logo.jfif",
      "id"  : 2
    }
  ];
  constructor() { }

  getAllPlotSections() : PlotSections[] {
    return this.plotSectionList;
  }

  getPlotSectionById(id: number) : PlotSections | undefined {
    return this.plotSectionList.find(plotSection => plotSection.id === id);
  }
}
