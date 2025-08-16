import { AIModel } from "@/types/chat";

export const AI_MODELS: AIModel[] = [
  {
    id: "microsoft/wizardlm-2-8x22b",
    name: "WizardLM 2 8x22B",
    description: "Free high-performance reasoning model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama 3.1 8B",
    description: "Meta's free instruction-tuned model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B",
    description: "Fast and efficient free model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
  {
    id: "google/gemma-7b-it:free",
    name: "Gemma 7B",
    description: "Google's free instruction model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
  {
    id: "huggingface/starcoder2-15b:free",
    name: "StarCoder2 15B",
    description: "Free code generation model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
  {
    id: "nousresearch/nous-capybara-7b:free",
    name: "Nous Capybara 7B",
    description: "Free conversational model",
    provider: "openrouter",
    apiFormat: "openai",
    free: true,
  },
];

export const API_ENDPOINTS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  custom: "", // User configurable
};