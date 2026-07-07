export type JsonSchema = {
  additionalProperties?: boolean;
  description?: string;
  enum?: readonly string[];
  items?: JsonSchema;
  maximum?: number;
  minimum?: number;
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  type: "array" | "boolean" | "integer" | "number" | "object" | "string";
};
