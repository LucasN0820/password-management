import { initLlama, type LlamaContext } from 'llama.rn';
import type { MobileModelId } from './types';

interface LoadedContext {
  context: LlamaContext;
  modelId: MobileModelId;
  cpuFallback: boolean;
}

let loaded: LoadedContext | null = null;

async function createContext(modelPath: string, nGpuLayers: number) {
  return initLlama({
    model: modelPath,
    n_ctx: 2048,
    n_batch: 256,
    n_gpu_layers: nGpuLayers,
    use_mlock: false,
  });
}

export async function getMobileLlamaContext(
  modelId: MobileModelId,
  modelPath: string
) {
  if (loaded?.modelId === modelId) return loaded;
  await releaseMobileLlamaContext();

  try {
    const context = await createContext(modelPath, 99);
    loaded = { context, modelId, cpuFallback: false };
    return loaded;
  } catch (gpuError) {
    try {
      const context = await createContext(modelPath, 0);
      loaded = { context, modelId, cpuFallback: true };
      return loaded;
    } catch (cpuError) {
      const message =
        cpuError instanceof Error ? cpuError.message : String(cpuError);
      throw new Error(
        `This device could not load ${modelId}. Try a smaller model. ${message}`,
        { cause: gpuError }
      );
    }
  }
}

export async function stopMobileLlamaCompletion() {
  if (loaded) await loaded.context.stopCompletion().catch(() => undefined);
}

export async function releaseMobileLlamaContext() {
  const current = loaded;
  loaded = null;
  if (!current) return;
  await current.context.stopCompletion().catch(() => undefined);
  await current.context.release().catch(() => undefined);
}
