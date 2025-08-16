
import { Message, AIModel, AppSettings } from "@/types/chat";
import { AI_MODELS, API_ENDPOINTS } from "@/constants/aiModels";

export async function sendAIMessage(
  messages: Message[],
  modelId: string,
  settings: AppSettings
): Promise<string> {
  try {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant using the ${model.name} model. Be concise, helpful, and friendly.`,
    };

    let apiUrl: string;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (model.provider === "openrouter") {
      apiUrl = API_ENDPOINTS.openrouter;
      if (settings.apiKeys.openrouter) {
        headers["Authorization"] = `Bearer ${settings.apiKeys.openrouter}`;
      }
      headers["HTTP-Referer"] = "https://your-app.com";
      headers["X-Title"] = "AI Chat App";
    } else if (model.provider === "openai") {
      apiUrl = API_ENDPOINTS.openai;
      if (settings.apiKeys.openai) {
        headers["Authorization"] = `Bearer ${settings.apiKeys.openai}`;
      }
    } else {
      apiUrl = settings.customEndpoint || API_ENDPOINTS.custom;
      if (settings.apiKeys.custom) {
        headers["Authorization"] = `Bearer ${settings.apiKeys.custom}`;
      }
    }

    if (!headers["Authorization"] && model.free) {
      apiUrl = "https://toolkit.rork.com/text/llm/";
      headers = { "Content-Type": "application/json" };
    }

    const requestBody = model.apiFormat === "openai" ? {
      model: model.id,
      messages: [systemMessage, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 2000,
    } : {
      messages: [systemMessage, ...formattedMessages],
    };

    console.log(`Sending request to ${apiUrl} with model ${model.id}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} - ${errorText}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    } else if (data.completion) {
      return data.completion;
    } else {
      console.error("Unexpected response format:", data);
      throw new Error("Unexpected response format from API");
    }
  } catch (error) {
    console.error("Error calling AI API:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}

export async function generateChatTitle(firstMessage: string, settings: AppSettings): Promise<string> {
  try {
    const response = await fetch("https://toolkit.rork.com/text/llm/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Generate a very short (2-4 words) title for this chat based on the first message. Reply with only the title, no quotes or punctuation.",
          },
          {
            role: "user",
            content: firstMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      return "New Chat";
    }

    const data = await response.json();
    return data.completion.slice(0, 30);
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
}

export function parseSlashCommand(input: string): { command: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  
  const parts = trimmed.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  return { command, args };
}

export function getConnectionStatus(model: AIModel, settings: AppSettings): 'connected' | 'no-key' | 'error' {
  if (model.free) return 'connected';
  
  const hasKey = model.provider === 'openrouter' ? !!settings.apiKeys.openrouter :
                 model.provider === 'openai' ? !!settings.apiKeys.openai :
                 !!settings.apiKeys.custom;
  
  return hasKey ? 'connected' : 'no-key';
}
