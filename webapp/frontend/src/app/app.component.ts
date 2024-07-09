import { Component } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { SearchbarComponent } from './searchbar/searchbar.component';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports : [HomeComponent, RouterModule, SearchbarComponent]
})
export class AppComponent {
  title = 'homes';

  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}

