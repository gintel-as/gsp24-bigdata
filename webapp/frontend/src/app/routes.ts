import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { KibanaComponent } from './kibana/kibana.component';
import { LogMergeComponent } from './log-merge/log-merge.component';
import { CallListComponent } from './call-list/call-list.component';

const routeConfig: Routes = [
    {
        path: '',
        component: HomeComponent,
        title: 'Home Page'
    },
    {
        path: 'kibana/:id',
        component: KibanaComponent,
        title: 'Kibana Page'
    },
    {
        path: 'log-merge/:id',
        component: LogMergeComponent,
        title: 'Logmerge Page'
    },
    {
        path: 'call-list/:id',
        component: CallListComponent,
        title: 'Call List Page'
    }
];

export default routeConfig;
