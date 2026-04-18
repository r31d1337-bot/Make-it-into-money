export type Role = "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
};

export type Context = {
  time?: string;
  budget?: string;
  tech?: string;
};

export type SharedPlan = {
  id: string;
  idea: string;
  context?: Context;
  messages: Message[];
  createdAt: number;
};
