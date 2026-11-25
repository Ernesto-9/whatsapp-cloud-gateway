import type { MetaClient, SendTemplateParams, SendTextParams, MetaSendResult } from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

export class GraphMetaClient implements MetaClient {
  async sendTemplate(phoneNumberId: string, token: string, p: SendTemplateParams): Promise<MetaSendResult> {
    const body = {
      messaging_product: "whatsapp",
      to: p.to,
      type: "template",
      template: {
        name: p.template,
        language: { code: p.language },
        components: p.variables?.length
          ? [{ type: "body", parameters: p.variables.map((v) => ({ type: "text", text: v })) }]
          : [],
      },
    };
    return this.post(phoneNumberId, token, body);
  }

  async sendText(phoneNumberId: string, token: string, p: SendTextParams): Promise<MetaSendResult> {
    const body = { messaging_product: "whatsapp", to: p.to, type: "text", text: { body: p.text } };
    return this.post(phoneNumberId, token, body);
  }

  private async post(phoneNumberId: string, token: string, body: unknown): Promise<MetaSendResult> {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Meta error ${res.status}: ${JSON.stringify(json)}`);
    return { waMessageId: json.messages?.[0]?.id };
  }
}
