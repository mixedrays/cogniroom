import type {
  Deck,
  DeckKind,
  DeckMetadata,
  DeckSource,
  FlashcardsContent,
  QuizContent,
  ReviewData,
} from "./types";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

export async function listDecks(): Promise<DeckMetadata[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks`);
    if (!response.ok) {
      console.error("Failed to list decks:", response.statusText);
      return [];
    }
    return await response.json();
  } catch (e) {
    console.error("Error listing decks:", e);
    return [];
  }
}

export async function getDeck(id: string): Promise<Deck | null> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}`);
    if (!response.ok) {
      if (response.status !== 404) {
        console.error(`Failed to fetch deck ${id}: ${response.statusText}`);
      }
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting deck ${id}:`, e);
    return null;
  }
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  kind: DeckKind;
  source?: DeckSource;
  content?: FlashcardsContent | QuizContent | null;
}

export async function createDeck(
  input: CreateDeckInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Create failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    console.error("Error creating deck:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteDeck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    console.error(`Error deleting deck ${id}:`, e);
    return { success: false, error: String(e) };
  }
}

export async function getDeckFlashcards(
  id: string
): Promise<{ content: FlashcardsContent } | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/decks/${id}/flashcards`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting deck flashcards ${id}:`, e);
    return null;
  }
}

export async function getDeckQuiz(
  id: string
): Promise<{ content: QuizContent } | null> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}/quiz`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting deck quiz ${id}:`, e);
    return null;
  }
}

export async function getDeckReviews(id: string): Promise<ReviewData | null> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}/reviews`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting deck reviews ${id}:`, e);
    return null;
  }
}

export interface GenerateDeckOptions {
  additionalInstructions?: string;
  model?: string;
  generationOptions?: string;
}

export async function generateFlashcardsDeck(
  options: GenerateDeckOptions = {}
): Promise<{
  success: boolean;
  id?: string;
  content?: FlashcardsContent;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/decks/flashcards/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Generate failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    console.error("Error generating flashcards deck:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateQuizDeck(
  options: GenerateDeckOptions = {}
): Promise<{
  success: boolean;
  id?: string;
  content?: QuizContent;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Generate failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    console.error("Error generating quiz deck:", e);
    return { success: false, error: String(e) };
  }
}

export async function saveDeckReviews(
  id: string,
  data: ReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}/reviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (e) {
    console.error("Error saving deck reviews:", e);
    return { success: false, error: String(e) };
  }
}
