import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';

import { NotificacaoComponent } from './notificacao.component';
import {
  NotificationService,
  NotificationStatus,
  StatusUpdate,
  NotificationResponse,
} from '../../services/notification.service';
import { ConfigService } from '../../services/config.service';

describe('NotificacaoComponent', () => {
  let component: NotificacaoComponent;
  let fixture: ComponentFixture<NotificacaoComponent>;
  let httpTestingController: HttpTestingController;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let configService: jasmine.SpyObj<ConfigService>;
  let statusUpdatesSubject: Subject<StatusUpdate>;

  const mockApiUrl = 'http://localhost:3000/api';
  const mockWebsocketUrl = 'http://localhost:3000';

  beforeEach(async () => {
    // Cria subject para simular WebSocket updates
    statusUpdatesSubject = new Subject<StatusUpdate>();

    // Cria spies para os serviços
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'enviarNotificacao',
      'consultarStatus',
      'consultarTodosStatus',
      'getStatusUpdates',
      'disconnect',
      'isConnected',
    ]);

    const configServiceSpy = jasmine.createSpyObj('ConfigService', [], {
      apiUrl: mockApiUrl,
      websocketUrl: mockWebsocketUrl,
      enableConsoleLog: false,
      websocketConfig: {
        transports: ['websocket'],
        autoConnect: true,
      },
    });

    // Configura comportamentos padrão dos spies
    notificationServiceSpy.getStatusUpdates.and.returnValue(
      statusUpdatesSubject.asObservable()
    );
    notificationServiceSpy.isConnected.and.returnValue(true);
    notificationServiceSpy.consultarTodosStatus.and.returnValue(of([]));
    notificationServiceSpy.enviarNotificacao.and.returnValue(
      of({
        mensagemId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Notificação enviada com sucesso',
      })
    );

    await TestBed.configureTestingModule({
      imports: [NotificacaoComponent, HttpClientTestingModule],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ConfigService, useValue: configServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacaoComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(
      NotificationService
    ) as jasmine.SpyObj<NotificationService>;
    configService = TestBed.inject(
      ConfigService
    ) as jasmine.SpyObj<ConfigService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Configuração do Componente', () => {
    it('deve criar o componente corretamente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com valores padrão corretos', () => {
      expect(component.mensagem).toBe('');
      expect(component.notificacoes).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.isConnected).toBe(false);
    });

    it('deve configurar a conexão WebSocket no ngOnInit', () => {
      component.ngOnInit();

      expect(notificationService.getStatusUpdates).toHaveBeenCalled();
      expect(notificationService.consultarTodosStatus).toHaveBeenCalled();
    });
  });

  describe('Geração e Envio de Notificação', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve gerar um mensagemId (UUID) válido ao enviar notificação', () => {
      // Arrange
      component.mensagem = 'Mensagem de teste';

      // Act
      component.enviarNotificacao();

      // Assert
      // Verifica se foi chamado o serviço com um UUID válido
      expect(notificationService.enviarNotificacao).toHaveBeenCalled();
      const callArgs =
        notificationService.enviarNotificacao.calls.mostRecent().args[0];
      expect(callArgs.conteudoMensagem).toBe('Mensagem de teste');
      expect(callArgs.mensagemId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('deve disparar requisição POST para o endpoint /api/notificar com dados corretos', () => {
      // Arrange
      const mensagemTeste = 'Teste de envio de notificação';
      component.mensagem = mensagemTeste;

      // Act
      component.enviarNotificacao();

      // Assert
      expect(notificationService.enviarNotificacao).toHaveBeenCalled();
      const callArgs =
        notificationService.enviarNotificacao.calls.mostRecent().args[0];
      expect(callArgs.conteudoMensagem).toBe(mensagemTeste);
      expect(callArgs.mensagemId).toBeDefined();
    });

    it('deve incluir mensagemId gerado e conteudoMensagem no corpo da requisição', () => {
      // Arrange
      const mensagemTeste = '  Mensagem com espaços  ';
      component.mensagem = mensagemTeste;

      // Act
      component.enviarNotificacao();

      // Assert
      expect(notificationService.enviarNotificacao).toHaveBeenCalled();
      const callArgs =
        notificationService.enviarNotificacao.calls.mostRecent().args[0];
      expect(callArgs.conteudoMensagem).toBe(mensagemTeste.trim());
      expect(callArgs.mensagemId).toBeDefined();
    });

    it('não deve permitir envio com mensagem vazia', () => {
      // Arrange
      component.mensagem = '';
      spyOn(window, 'alert');

      // Act
      component.enviarNotificacao();

      // Assert
      expect(window.alert).toHaveBeenCalledWith(
        'Por favor, digite uma mensagem!'
      );
      expect(notificationService.enviarNotificacao).not.toHaveBeenCalled();
    });

    it('não deve permitir envio com mensagem contendo apenas espaços', () => {
      // Arrange
      component.mensagem = '   ';
      spyOn(window, 'alert');

      // Act
      component.enviarNotificacao();

      // Assert
      expect(window.alert).toHaveBeenCalledWith(
        'Por favor, digite uma mensagem!'
      );
      expect(notificationService.enviarNotificacao).not.toHaveBeenCalled();
    });
  });

  describe('Atualização de Estado Inicial', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve adicionar nova notificação à lista interna imediatamente após envio', fakeAsync(() => {
      // Arrange
      const mensagemTeste = 'Mensagem de teste';
      component.mensagem = mensagemTeste;
      const initialLength = component.notificacoes.length;

      // Configura o spy para usar um Subject que podemos controlar
      const responseSubject = new Subject<NotificationResponse>();
      notificationService.enviarNotificacao.and.returnValue(
        responseSubject.asObservable()
      );

      // Act
      component.enviarNotificacao();

      // Assert - Verifica imediatamente após o envio, antes da resposta
      expect(component.notificacoes.length).toBe(initialLength + 1);

      const novaNotificacao = component.notificacoes[0]; // unshift adiciona no início
      expect(novaNotificacao.mensagemId).toBeDefined();
      expect(novaNotificacao.mensagemId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(novaNotificacao.conteudoMensagem).toBe(mensagemTeste);
      expect(novaNotificacao.status).toBe('AGUARDANDO_PROCESSAMENTO');
      expect(novaNotificacao.timestamp).toBeDefined();
    }));

    it('deve adicionar a notificação no início da lista (unshift)', fakeAsync(() => {
      // Arrange
      component.notificacoes = [
        {
          mensagemId: 'existing-id',
          conteudoMensagem: 'Mensagem existente',
          status: 'PROCESSADO_SUCESSO',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ];
      component.mensagem = 'Nova mensagem';

      // Configura o spy para usar um Subject que podemos controlar
      const responseSubject = new Subject<NotificationResponse>();
      notificationService.enviarNotificacao.and.returnValue(
        responseSubject.asObservable()
      );

      // Act
      component.enviarNotificacao();

      // Assert - Verifica imediatamente após o envio
      expect(component.notificacoes[0].mensagemId).toBeDefined();
      expect(component.notificacoes[0].mensagemId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(component.notificacoes[0].status).toBe('AGUARDANDO_PROCESSAMENTO');
      expect(component.notificacoes[1].mensagemId).toBe('existing-id');
    }));

    it('deve definir timestamp atual para a nova notificação', () => {
      // Arrange
      const beforeTime = new Date().getTime();
      component.mensagem = 'Mensagem com timestamp';

      // Act
      component.enviarNotificacao();

      // Assert
      const afterTime = new Date().getTime();
      const notificacao = component.notificacoes[0];
      const notificacaoTime = new Date(notificacao.timestamp).getTime();

      expect(notificacaoTime).toBeGreaterThanOrEqual(beforeTime);
      expect(notificacaoTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Fluxo de Resposta HTTP', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve atualizar status para PENDENTE após receber resposta 202 Accepted', fakeAsync(() => {
      // Arrange
      component.mensagem = 'Teste resposta HTTP';

      // Configura o spy para usar um Subject que podemos controlar
      const responseSubject = new Subject<NotificationResponse>();
      notificationService.enviarNotificacao.and.returnValue(
        responseSubject.asObservable()
      );

      // Act
      component.enviarNotificacao();

      // Assert - Verifica estado inicial imediatamente após o envio
      expect(component.notificacoes[0].status).toBe('AGUARDANDO_PROCESSAMENTO');
      expect(component.isLoading).toBe(true);
      expect(component.mensagem).toBe('Teste resposta HTTP'); // Ainda não foi limpo

      // Simula resposta bem-sucedida
      responseSubject.next({
        mensagemId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Notificação enviada com sucesso',
      });
      responseSubject.complete();
      tick();

      // Assert - Verifica estado após resposta
      expect(component.notificacoes[0].status).toBe('PENDENTE');
      expect(component.isLoading).toBe(false);
      expect(component.mensagem).toBe(''); // Campo deve ser limpo
    }));

    it('deve limpar o campo de mensagem após envio bem-sucedido', () => {
      // Arrange
      const mensagemOriginal = 'Mensagem a ser limpa';
      component.mensagem = mensagemOriginal;

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.mensagem).toBe('');
    });

    it('deve definir isLoading como true durante o envio e false após sucesso', () => {
      // Arrange
      component.mensagem = 'Teste loading state';

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.isLoading).toBe(false); // Já foi processado pelo spy
    });

    it('deve manter a notificação na lista após sucesso', () => {
      // Arrange
      component.mensagem = 'Mensagem de sucesso';
      const initialLength = component.notificacoes.length;

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.notificacoes.length).toBe(initialLength + 1);
      expect(component.notificacoes[0].mensagemId).toBeDefined();
      expect(component.notificacoes[0].mensagemId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('Tratamento de Erros', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve remover notificação da lista em caso de erro na requisição', () => {
      // Arrange
      component.mensagem = 'Mensagem que falhará';
      notificationService.enviarNotificacao.and.returnValue(
        throwError(() => new Error('Erro de rede'))
      );
      spyOn(window, 'alert');

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.notificacoes.length).toBe(0);
      expect(window.alert).toHaveBeenCalledWith(
        'Erro ao enviar notificação. Tente novamente.'
      );
      expect(component.isLoading).toBe(false);
    });

    it('deve exibir alerta de erro quando requisição falha', () => {
      // Arrange
      component.mensagem = 'Mensagem com erro';
      notificationService.enviarNotificacao.and.returnValue(
        throwError(() => new Error('Servidor indisponível'))
      );
      spyOn(window, 'alert');

      // Act
      component.enviarNotificacao();

      // Assert
      expect(window.alert).toHaveBeenCalledWith(
        'Erro ao enviar notificação. Tente novamente.'
      );
    });

    it('deve definir isLoading como false após erro', () => {
      // Arrange
      component.mensagem = 'Teste erro loading';
      notificationService.enviarNotificacao.and.returnValue(
        throwError(() => new Error('Erro'))
      );

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Estados do Componente', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve desabilitar o botão durante o carregamento', fakeAsync(() => {
      // Arrange
      component.mensagem = 'Teste botão desabilitado';

      // Configura o spy para usar um Subject que podemos controlar
      const responseSubject = new Subject<NotificationResponse>();
      notificationService.enviarNotificacao.and.returnValue(
        responseSubject.asObservable()
      );

      // Act
      component.enviarNotificacao();

      // Assert
      expect(component.isLoading).toBe(true);

      // Resolve o observable
      responseSubject.next({
        mensagemId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Sucesso',
      });
      responseSubject.complete();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('deve trimmar espaços da mensagem antes do envio', () => {
      // Arrange
      const mensagemComEspacos = '  Mensagem com espaços  ';
      component.mensagem = mensagemComEspacos;

      // Act
      component.enviarNotificacao();

      // Assert
      expect(notificationService.enviarNotificacao).toHaveBeenCalled();
      const callArgs =
        notificationService.enviarNotificacao.calls.mostRecent().args[0];
      expect(callArgs.conteudoMensagem).toBe('Mensagem com espaços');
      expect(callArgs.mensagemId).toBeDefined();
    });
  });

  describe('WebSocket e Atualizações de Status', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('deve processar atualizações de status via WebSocket', () => {
      // Arrange
      const testId = '123e4567-e89b-12d3-a456-426614174000';
      component.notificacoes = [
        {
          mensagemId: testId,
          conteudoMensagem: 'Mensagem teste',
          status: 'PENDENTE',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ];

      const statusUpdate: StatusUpdate = {
        mensagemId: testId,
        status: 'PROCESSADO_SUCESSO',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      // Act
      statusUpdatesSubject.next(statusUpdate);

      // Assert
      expect(component.notificacoes[0].status).toBe('PROCESSADO_SUCESSO');
      expect(component.notificacoes[0].processedAt).toBe(
        'Sun Jan 01 2023 09:00:00 GMT-0300 (Horário Padrão de Brasília)'
      );
    });

    it('deve verificar conexão WebSocket periodicamente', fakeAsync(() => {
      // Arrange
      notificationService.isConnected.and.returnValue(false);

      // Reset para contar apenas as chamadas do teste
      notificationService.isConnected.calls.reset();

      // Act
      component.ngOnInit();
      expect(notificationService.isConnected).toHaveBeenCalledTimes(1); // Chamada inicial

      tick(2100); // Simula passagem de tempo maior que 2 segundos

      // Assert
      expect(notificationService.isConnected).toHaveBeenCalledTimes(2); // Uma no início, uma no intervalo
      expect(component.isConnected).toBe(false);
    }));
  });

  describe('Cleanup e Lifecycle', () => {
    it('deve desconectar WebSocket no ngOnDestroy', () => {
      // Arrange
      component.ngOnInit();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(notificationService.disconnect).toHaveBeenCalled();
    });

    it('deve unsubscribe das atualizações de status no ngOnDestroy', () => {
      // Arrange
      component.ngOnInit();
      spyOn(component['statusUpdateSubscription']!, 'unsubscribe');

      // Act
      component.ngOnDestroy();

      // Assert
      expect(
        component['statusUpdateSubscription']!.unsubscribe
      ).toHaveBeenCalled();
    });
  });
});
