import OpenAI from "openai";
import { env } from "~/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateNoteName(content: string, attempt = 0): Promise<string> {
  try {
    const truncatedContent = content.slice(0, 500);
    
    // Different system prompts for each attempt to get varied results
    const systemPrompts = [
      "You are a concise note naming assistant. Generate a very short name (max 15 chars) for a note based on its content. The name must be memorable and reflect the note's essence. Return only the name, nothing else.",
      "You are a note naming assistant. Create a unique, short name (max 15 chars) that captures the main topic. Focus on key concepts. Return only the name, nothing else.",
      "You are a note naming assistant. Generate a creative name (max 15 chars) using metaphors related to the content. Be clear and concise. Return only the name, nothing else."
    ];

    const systemPrompt = systemPrompts[attempt % systemPrompts.length];
    if (!systemPrompt) {
      throw new Error("Invalid attempt number");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: truncatedContent || "Empty note"
        }
      ],
      max_tokens: 10,
      temperature: 0.7 + (attempt * 0.1), // Increase creativity with each attempt
    });

    let generatedName = completion.choices[0]?.message?.content?.trim() ?? "Untitled Note";
    // Ensure the name is not longer than 15 characters
    if (generatedName.length > 15) {
      generatedName = generatedName.slice(0, 15).trim();
    }
    return generatedName;
  } catch (error) {
    console.error("Error generating note name:", error);
    return "Untitled Note";
  }
} 