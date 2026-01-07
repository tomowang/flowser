import { Registry } from "./registry";
import {
  ManualTrigger,
  HttpRequest,
  AgentNode,
  CalculatorTool,
  GeminiModel,
  Code,
  TabQuery,
  TabClose,
} from "./index";

Registry.register(ManualTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(CalculatorTool);
Registry.register(GeminiModel);
Registry.register(Code);
Registry.register(TabQuery);
Registry.register(TabClose);
