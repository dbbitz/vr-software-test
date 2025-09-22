import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  production: boolean;
  apiUrl: string;
  websocketUrl: string;
  enableConsoleLog: boolean;
  websocketConfig: {
    transports: string[];
    autoConnect: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Carrega configurações do environment (gerado a partir do .env)
    const config: AppConfig = {
      production: environment.production,
      apiUrl: environment.apiUrl,
      websocketUrl: environment.websocketUrl,
      enableConsoleLog: environment.enableConsoleLog,
      websocketConfig: environment.websocketConfig,
    };

    // Permite override via localStorage (útil para desenvolvimento/testes)
    const localConfig = localStorage.getItem('app-config-override');
    if (localConfig) {
      try {
        const parsedConfig = JSON.parse(localConfig);
        return { ...config, ...parsedConfig };
      } catch (error) {
        console.warn('Erro ao carregar override do localStorage:', error);
      }
    }

    return config;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get websocketUrl(): string {
    return this.config.websocketUrl;
  }

  get enableConsoleLog(): boolean {
    return this.config.enableConsoleLog;
  }

  get websocketConfig() {
    return this.config.websocketConfig;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  // Método para atualizar configuração em runtime (útil para testes)
  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('app-config-override', JSON.stringify(newConfig));
  }

  // Método para resetar configuração para padrão
  resetConfig(): void {
    localStorage.removeItem('app-config-override');
    this.config = this.loadConfig();
  }

  // Método para recarregar configurações (útil após mudanças no .env)
  reloadConfig(): void {
    this.config = this.loadConfig();
  }
}
