import { toolDefinitions, toolImplementations } from "src/modules/tools/services/agent-tools.service";


export function mapToolsToRealtime() {
  return toolDefinitions.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

export async function handleFunctionCall(call: any) {
  const { name, arguments: argString } = call;
  const args = JSON.parse(argString || "{}");

  const impl = toolImplementations.get(name);
  if (!impl) {
    return {
      error: `Tool '${name}' não existe.`,
    };
  }

  return await impl(args);
}
