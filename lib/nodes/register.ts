import { Registry } from "./registry";
import {
  ManualTrigger,
  HttpRequest,
  AgentNode,
  CalculatorTool,
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
} from "./index";


Registry.register(ManualTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(CalculatorTool);
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
