export interface WebhookEvent {
    event: string;
    data: any;
}

export interface UseWebhookConnectionProps {
    setConnectionStatus: (status: string) => void;
    setSessionId: (sessionId: string) => void;
}
