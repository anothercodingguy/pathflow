import { NextResponse } from "next/server";
import { dispatchAlertToWebhooks } from "@/lib/alerts";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const url = body.url;
    const type = body.type || "SLACK";

    if (url) {
      // Send directly to given URL for testing
      let payload: any;
      if (type === "SLACK") {
        payload = {
          text: "✅ *[PathFlow Connection Test]* Webhook successfully connected to PathFlow!",
          attachments: [
            {
              color: "#3B82F6",
              title: "PathFlow Agent Observability",
              text: "Alert notifications for Critical Anomaly Detections, High Costs, and Error Spikes will appear here.",
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };
      } else if (type === "DISCORD") {
        payload = {
          content: "✅ **PathFlow Connection Test:** Webhook successfully connected!",
          embeds: [
            {
              title: "PathFlow Observability Alerts",
              description: "Alert notifications for Critical Anomaly Detections, High Costs, and Error Spikes will appear here.",
              color: 3900150,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      } else {
        payload = {
          event: "pathflow.test",
          message: "Test webhook successful",
          timestamp: new Date().toISOString(),
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: `Webhook returned status ${res.status}` }, { status: 400 });
      }
    } else {
      await dispatchAlertToWebhooks(
        {
          title: "Test Alert: Tool Loop Detected in Production",
          message: "Simulated alert from PathFlow Settings verification.",
          severity: "CRITICAL",
          costUsd: 0.125,
          agentName: "SupportBot",
          detectionType: "TOOL_LOOP",
        },
        user.id
      );
    }

    return NextResponse.json({ success: true, message: "Test alert dispatched successfully!" });
  } catch (error: any) {
    console.error("[Test Alert Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
