import { TestBed } from '@angular/core/testing';
import { AppConfigService } from 'src/app/providers/app-config.service';
import { VoiceStreamingService } from './voice-streaming.service';

describe('VoiceStreamingService', () => {
  let service: VoiceStreamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: { getConfig: () => ({ voiceProxyWsUrl: '' }) },
        },
      ],
    });
    service = TestBed.inject(VoiceStreamingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
