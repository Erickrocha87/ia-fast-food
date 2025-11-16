import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class SessionMemory {
  tableNumber: string;
  history: ChatCompletionMessageParam[];
  currentOrderId: number | null;

  constructor(tableNumber: string) {
    this.tableNumber = tableNumber;
    this.history = [];
    this.currentOrderId = null;
  }

  push(msg: ChatCompletionMessageParam) {
    this.history.push(msg);
  }

  serialize() {
    return this.history.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }
}
