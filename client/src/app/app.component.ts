import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacaoComponent } from './components/notificacao/notificacao.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificacaoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Sistema de Notificações';
}
