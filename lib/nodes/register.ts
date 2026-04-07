import { Registry } from "./registry";
import {
  ManualTrigger,
  HttpRequest,
  AgentNode,
  GeminiModel,
  OpenAIModel,
  ClaudeModel,
  DeepSeekModel,
  Code,
  TabQuery,
  TabGroupQuery,
  TabAction,
  TabCreated,
  TabUpdated,
  ClickElement,
  WindowCreate,
  WindowQuery,
  WindowClose,
  Wait,
  TestNode,
  FetchContent,
  ScheduleTrigger,
  EditFields,
  DataTable,
  If,
} from "./index";

Registry.register(ManualTrigger);
Registry.register(ScheduleTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(GeminiModel);
Registry.register(OpenAIModel);
Registry.register(ClaudeModel);
Registry.register(DeepSeekModel);
Registry.register(Code);
Registry.register(TabQuery);
Registry.register(TabGroupQuery);
Registry.register(TabAction);
Registry.register(TabCreated);
Registry.register(TabUpdated);
Registry.register(ClickElement);
Registry.register(WindowCreate);
Registry.register(WindowQuery);
Registry.register(WindowClose);
Registry.register(Wait);
Registry.register(FetchContent);
Registry.register(EditFields);
Registry.register(DataTable);
Registry.register(If);

if (import.meta.env.DEV) {
  Registry.register(TestNode);
}
