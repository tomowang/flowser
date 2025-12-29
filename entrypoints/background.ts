import { browser, defineBackground } from "#imports";
import {
  MessageType,
  type RuntimeMessage,
  type ExecuteHttpRequestPayload,
} from "../lib/messages";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  browser.runtime.onMessage.addListener(
    (message: RuntimeMessage, sender, sendResponse) => {
      if (message.type === MessageType.HTTP_EXECUTE_REQUEST) {
        const payload = message.payload as ExecuteHttpRequestPayload;
        fetch(payload.url, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body ? JSON.stringify(payload.body) : undefined,
        })
          .then((response) => response.json())
          .then((data) => {
            sendResponse({ success: true, data });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });

        return true; // Keep the message channel open for async response
      }
    },
  );
});
