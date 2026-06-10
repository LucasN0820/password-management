
import { parseCredentialCandidates } from '@repo/ai-import-core/credentials';
import { credentialJsonSchema } from '@repo/ai-import-core/credentials';
import { buildCredentialMessages } from '@repo/ai-import-core/prompt';
import type { ImportExtractor } from '@repo/ai-import-core/types';
import { getMobileLlamaContext } from './mobile-llama-runtime';
import { markMobileModelUsed } from './model-manager';
import type { MobileModelId } from './types';

const STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|im_end|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
  '<|endoftext|>',
];

export function createMobileLlamaExtractor(
  modelId: MobileModelId,
  modelPath: string
): ImportExtractor {
  return async (file, workflowContext) => {
    if (file.kind === 'image') {
      throw new Error('Image import is not supported on Mobile.');
    }
    if (file.prefilledCandidates.length > 0) return file.prefilledCandidates;
    if (!file.text.trim()) return [];

    const loaded = await getMobileLlamaContext(modelId, modelPath);
    const stop = () => {
      void loaded.context.stopCompletion();
    };
    workflowContext.signal?.addEventListener('abort', stop, { once: true });

    try {
      const result = await loaded.context.completion({
        messages: buildCredentialMessages(file).map(message => ({
          ...message,
        })),
        n_predict: 1200,
        temperature: 0,
        stop: STOP_WORDS,
        response_format: {
          type: 'json_schema',
          json_schema: {
            strict: true,
            schema: credentialJsonSchema,
          },
        },
        chat_template_kwargs: {
          enable_thinking: false,
        },
      });
      await markMobileModelUsed(modelId);
      return parseCredentialCandidates(
        result.text,
        file.file.name,
        workflowContext.createId,
        file.excerpts
      );
    } finally {
      workflowContext.signal?.removeEventListener('abort', stop);
    }
  };
}
