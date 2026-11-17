import { Component, input } from '@angular/core';
import { NavbarComponent } from '../../organisms/navbar/navbar';
import { FooterComponent } from '../../organisms/footer/footer';

@Component({
  selector: 'app-main-layout',
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  appTitle = input<string>('User Management');
}
