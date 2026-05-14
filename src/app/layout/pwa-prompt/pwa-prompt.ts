import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaService } from '../../core/pwa.service';

@Component({
  selector: 'app-pwa-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pwa-prompt.html',
  styleUrl: './pwa-prompt.scss',
})
export class PwaPrompt {
  protected readonly pwa = inject(PwaService);
}
