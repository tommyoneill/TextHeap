import OpenAI from "openai";
import { env } from "~/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateNoteName(content: string): Promise<string> {
  try {
    const truncatedContent = content.slice(0, 500);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative note naming assistant. Generate a concise, creative name (15-20 characters) for a note based on its content. Use popular memes to make the names funny.The name should be memorable and reflect the note's essence. Return only the name, nothing else."
        },
        {
          role: "user",
          content: truncatedContent || "Empty note"
        }
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const generatedName = completion.choices[0]?.message?.content?.trim() ?? "Untitled Note";
    return generatedName;
  } catch (error) {
    console.error("Error generating note name:", error);
    return "Untitled Note";
  }
} 