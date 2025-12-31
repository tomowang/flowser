import { Registry } from "./registry";
import {
  ManualTrigger,
  HttpRequest,
  AgentNode,
  CalculatorTool,
  GeminiModel,
  Code,
} from "./index";

Registry.register(ManualTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(CalculatorTool);
Registry.register(GeminiModel);
Registry.register(Code);
