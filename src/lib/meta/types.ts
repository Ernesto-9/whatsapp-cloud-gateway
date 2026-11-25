export interface SendTemplateParams {
  to: string;
  template: string;
  language: string;
  variables?: string[];
}
export interface SendTextParams {
  to: string;
  text: string;
}
export interface MetaSendResult {
  waMessageId: string;
}
export interface MetaClient {
  sendTemplate(phoneNumberId: string, token: string, p: SendTemplateParams): Promise<MetaSendResult>;
  sendText(phoneNumberId: string, token: string, p: SendTextParams): Promise<MetaSendResult>;
}
