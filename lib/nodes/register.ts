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
  TabClose,
  TabCreated,
  ClickElement,
  TabCreate,
  WindowCreate,
  WindowQuery,
  Wait,
} from "./index";


Registry.register(ManualTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(GeminiModel);
Registry.register(OpenAIModel);
Registry.register(ClaudeModel);
Registry.register(DeepSeekModel);
Registry.register(Code);
Registry.register(TabQuery);
Registry.register(TabClose);
Registry.register(TabCreated);
Registry.register(ClickElement);
Registry.register(TabCreate);
Registry.register(WindowCreate);
Registry.register(WindowQuery);
Registry.register(Wait);

