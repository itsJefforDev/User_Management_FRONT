import { Component, model, output } from '@angular/core';
import { InputComponent } from '../../atoms/input/input';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-search-bar',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBarComponent {
  query = model<string>('');
  search = output<string>();

  protected onQueryChange(val: string) {
    this.query.set(val);
    this.search.emit(val);
  }

  protected clearQuery() {
    this.query.set('');
    this.search.emit('');
  }

  protected triggerSearch() {
    this.search.emit(this.query());
  }
}
