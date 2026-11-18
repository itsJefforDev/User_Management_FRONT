import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-header',
  imports: [],
  templateUrl: './auth-header.html',
  styleUrl: './auth-header.scss',
})
export class AuthHeaderComponent {
  title = input<string>('Bienvenido');
  subtitle = input<string>('Ingresa a tu cuenta para continuar');
}
