/**
 * Home Assistant base URL and WebSocket URL.
 * When running inside Hass.io: uses supervisor host.
 * When running standalone (Docker or dev): set HOME_ASSISTANT_URL (e.g. http://192.168.1.100:8123).
 */

export function getHABaseUrl(): string {
  const url = process.env.HOME_ASSISTANT_URL;
  if (url) {
    return url.replace(/\/$/, '');
  }
  return 'http://supervisor/core';
}

export function getHAWebSocketUrl(): string {
  const url = process.env.HOME_ASSISTANT_URL;
  if (url) {
    const parsed = new URL(url);
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${parsed.host}/api/websocket`;
  }
  return 'ws://supervisor/core/websocket';
}
