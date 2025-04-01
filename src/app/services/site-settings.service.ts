import { Injectable } from '@angular/core';
import { SiteSettings } from '../../model/shared-models/site-settings.model';
import { BehaviorSubject, tap } from 'rxjs';
import { SocketService } from './socket.service';
import { ClientApiService } from './client-api.service';

@Injectable({
  providedIn: 'root'
})
export class SiteSettingsService {
  constructor(
    private readonly clientApiService: ClientApiService,
    private readonly socketService: SocketService,
  ) {
    this.initialize();
  }

  initialize(): void {
    // Get the current value of the site settings from the server.
    this.updateSiteSettingsFromServer();

    // Subscribe for updates to these settings from the server.
    this.socketService.subscribeToSocketEvent('receiveSiteSettings').subscribe((event) => {
      this.siteSettings = event.args[0];
    });
  }

  // #region siteSettings
  private readonly _siteSettings = new BehaviorSubject<SiteSettings>({ type: 'site-settings', allowAudioChat: false });
  readonly siteSettings$ = this._siteSettings.asObservable();

  get siteSettings(): SiteSettings {
    return this._siteSettings.getValue();
  }

  set siteSettings(newVal: SiteSettings) {
    this._siteSettings.next(newVal);
  }
  // #endregion

  /** Updates the value of the site settings from the server. */
  async updateSiteSettingsFromServer(): Promise<void> {
    await this.clientApiService.getSiteSettings().subscribe(
      newVal => {
        this.siteSettings = newVal;
      }
    );
  }
}
