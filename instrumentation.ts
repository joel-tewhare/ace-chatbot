import { LangfuseSpanProcessor } from '@langfuse/otel'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

function isAiTelemetryEnabled(): boolean {
  const value = process.env.AI_TELEMETRY_ENABLED?.toLowerCase()
  return value === '1' || value === 'true'
}

function hasLangfuseCredentials(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY?.trim() &&
      process.env.LANGFUSE_SECRET_KEY?.trim(),
  )
}

export const langfuseSpanProcessor = new LangfuseSpanProcessor()

let otelRegistered = false

export function isLangfuseOtelActive(): boolean {
  return otelRegistered
}

export async function flushLangfuseTelemetry(): Promise<void> {
  if (!otelRegistered) return
  await langfuseSpanProcessor.forceFlush()
}

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }
  if (otelRegistered) {
    return
  }
  if (!hasLangfuseCredentials() || !isAiTelemetryEnabled()) {
    return
  }

  const provider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  })

  provider.register()
  otelRegistered = true
}
