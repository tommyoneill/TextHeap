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
      "You are a creative note naming assistant. Generate a concise, creative name (15-20 characters) for a note based on its content. Use popular memes to make the names funny. The name should be memorable and reflect the note's essence. Return only the name, nothing else.",
      "You are a note naming assistant. Create a unique, descriptive name (15-20 characters) that captures the main topic or theme of the note. Focus on the key concepts. Return only the name, nothing else.",
      "You are a note naming assistant. Generate a creative name (15-20 characters) using metaphors or analogies related to the note's content. Be imaginative but clear. Return only the name, nothing else."
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
      max_tokens: 20,
      temperature: 0.7 + (attempt * 0.1), // Increase creativity with each attempt
    });

    const generatedName = completion.choices[0]?.message?.content?.trim() ?? "Untitled Note";
    return generatedName;
  } catch (error) {
    console.error("Error generating note name:", error);
    return "Untitled Note";
  }
} 