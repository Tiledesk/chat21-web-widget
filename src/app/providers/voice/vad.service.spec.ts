import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { VadService } from './vad.service';

describe('VadService', () => {
  let service: VadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VadService,
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: (url: string) => `/${url}`,
          },
        },
      ],
    });
    service = TestBed.inject(VadService);
  });

  it('should expose VAD and ONNX WASM base URLs with trailing slash', () => {
    expect(service.getVadAssetBaseUrl()).toBe('/assets/vad/');
    expect(service.getOnnxWasmBaseUrl()).toBe('/assets/onnx/');
  });
});
