import { prisma } from "@/lib/prisma";

export interface AlertPayload {
  title: string;
  message: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  runId?: string;
  runTitle?: string;
  agentName?: string;
  costUsd?: number;
  errorType?: string;
  detectionType?: string;
  evidence?: string[];
}

/**
 * Format and dispatch an alert to all active webhooks
 */
export async function dispatchAlertToWebhooks(payload: AlertPayload, userId?: string) {
  try {
    const where: any = { enabled: true };
    if (userId) where.userId = userId;

    const webhooks = await prisma.alertWebhook.findMany({ where });
    if (webhooks.length === 0) return { dispatched: 0 };

    const rawHost = process.env.NEXT_PUBLIC_APP_URL || "https://thepathflow.online/app";
    const traceUrl = payload.runId ? `${rawHost}/runs/${payload.runId}` : rawHost;

    const promises = webhooks.map(async (webhook) => {
      // Check filters
      if (webhook.minSeverity === "CRITICAL" && payload.severity !== "CRITICAL") {
        return;
      }
      if (webhook.minCostUsd && payload.costUsd && payload.costUsd < webhook.minCostUsd) {
        return;
      }

      try {
        let body: any;
        if (webhook.type === "SLACK") {
          body = {
            text: `🚨 *[PathFlow Alert]* ${payload.title}`,
            attachments: [
              {
                color: payload.severity === "CRITICAL" ? "#EF4444" : "#F59E0B",
                title: payload.title,
                title_link: traceUrl,
                text: payload.message,
                fields: [
                  { title: "Severity", value: payload.severity, short: true },
                  { title: "Agent", value: payload.agentName || "Production Agent", short: true },
                  ...(payload.costUsd ? [{ title: "Cost", value: `$${payload.costUsd.toFixed(4)}`, short: true }] : []),
                  ...(payload.errorType ? [{ title: "Error Type", value: payload.errorType, short: true }] : []),
                ],
                footer: "PathFlow Agent Observability",
                ts: Math.floor(Date.now() / 1000),
              },
            ],
          };
        } else if (webhook.type === "DISCORD") {
          body = {
            content: `🚨 **PathFlow Alert:** ${payload.title}`,
            embeds: [
              {
                title: payload.title,
                url: traceUrl,
                description: payload.message,
                color: payload.severity === "CRITICAL" ? 15673636 : 16097035, // Red or Amber
                fields: [
                  { name: "Severity", value: payload.severity, inline: true },
                  { name: "Agent", value: payload.agentName || "Agent", inline: true },
                  ...(payload.costUsd ? [{ name: "Run Cost", value: `$${payload.costUsd.toFixed(4)}`, inline: true }] : []),
                ],
                footer: { text: "PathFlow Agent Observability" },
                timestamp: new Date().toISOString(),
              },
            ],
          };
        } else {
          // Generic HTTP webhook
          body = {
            event: "pathflow.alert",
            timestamp: new Date().toISOString(),
            traceUrl,
            ...payload,
          };
        }

        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          await prisma.alertWebhook.update({
            where: { id: webhook.id },
            data: { lastFiredAt: new Date(), failureCount: 0 },
          });
        } else {
          await prisma.alertWebhook.update({
            where: { id: webhook.id },
            data: { failureCount: { increment: 1 } },
          });
        }
      } catch (err) {
        console.error(`[Webhook Dispatch Error for ${webhook.name}]:`, err);
        await prisma.alertWebhook.update({
          where: { id: webhook.id },
          data: { failureCount: { increment: 1 } },
        });
      }
    });

    await Promise.allSettled(promises);
    return { dispatched: webhooks.length };
  } catch (error) {
    console.error("[Alert Engine Error]:", error);
    return { dispatched: 0, error };
  }
}
