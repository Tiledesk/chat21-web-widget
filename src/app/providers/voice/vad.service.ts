import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { MicVAD, getDefaultRealTimeVADOptions } from '@ricky0123/vad-web';
import type { RealTimeVADOptions } from '@ricky0123/vad-web';

/**
 * MicVAD (@ricky0123/vad-web): modelli in assets/vad/, WASM ONNX in assets/onnx/
 * (allineato a ort.env.wasm.wasmPaths = "/assets/onnx/").
 */
@Injectable({ providedIn: 'root' })
export class VadService {
  private onnxRuntimeEnvPromise: Promise<void> | null = null;

  constructor(private readonly location: Location) {}

  /**
   * Base URL per silero_vad_legacy.onnx / vad.worklet.bundle.min.js
   * (MicVAD usa baseAssetPath + nome file interno, non modelURL singolo).
   */
  getVadAssetBaseUrl(): string {
    return this.ensureTrailingSlash(this.location.prepareExternalUrl('assets/vad/'));
  }

  /** Base URL per ort-wasm-*.mjs / .wasm (es. /assets/onnx/). */
  getOnnxWasmBaseUrl(): string {
    return this.ensureTrailingSlash(this.location.prepareExternalUrl('assets/onnx/'));
  }

  /**
   * Pre-configura il modulo onnxruntime-web/wasm (stesso usato da MicVAD):
   * wasmPaths + numThreads prima del primo MicVAD.new.
   */
  ensureOnnxRuntimeEnv(): Promise<void> {
    if (!this.onnxRuntimeEnvPromise) {
      this.onnxRuntimeEnvPromise = (async () => {
        const ort = await import('onnxruntime-web/wasm');
        const wasmBase = this.getOnnxWasmBaseUrl();
        ort.env.wasm.wasmPaths = wasmBase;
        ort.env.wasm.numThreads = 1;
        ort.env.logLevel = 'error';
      })();
    }
    return this.onnxRuntimeEnvPromise;
  }

  async createMicVad(overrides: Partial<RealTimeVADOptions>): Promise<MicVAD> {
    await this.ensureOnnxRuntimeEnv();
    const base = getDefaultRealTimeVADOptions('legacy');
    const vadBase = this.getVadAssetBaseUrl();
    const ortWasmBase = this.getOnnxWasmBaseUrl();

    return MicVAD.new({
      ...base,
      startOnLoad: false,
      baseAssetPath: vadBase,
      onnxWASMBasePath: ortWasmBase,
      ortConfig: (ort) => {
        base.ortConfig?.(ort);
        ort.env.wasm.wasmPaths = ortWasmBase;
        ort.env.wasm.numThreads = 1;
        ort.env.logLevel = 'error';
      },
      ...overrides,
    });
  }

  private ensureTrailingSlash(path: string): string {
    return path.endsWith('/') ? path : `${path}/`;
  }
}
