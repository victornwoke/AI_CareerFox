export class AiProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}
