import { Injectable, signal } from '@angular/core';

export type NotificationType = 'warning' | 'danger' | 'info' | 'success';

export interface AppNotification {
  type: NotificationType;
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly alertSignal = signal<AppNotification | null>(null);

  readonly currentAlert = this.alertSignal.asReadonly();

  showWarning(message: string, title: string = 'Advertencia de Seguridad') {
    this.alertSignal.set({ type: 'warning', message, title });
    setTimeout(() => this.clear(), 7000);
  }

  showError(message: string, title: string = 'Error de Acceso') {
    this.alertSignal.set({ type: 'danger', message, title });
    setTimeout(() => this.clear(), 7000);
  }

  showSuccess(message: string, title?: string) {
    this.alertSignal.set({ type: 'success', message, title });
    setTimeout(() => this.clear(), 4000);
  }

  clear() {
    this.alertSignal.set(null);
  }
}
