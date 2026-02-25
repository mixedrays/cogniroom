import { useReducer, useEffect, useRef, useCallback } from "react";
import { AgentMessageSchema, type AgentMessage } from "../schema";
import type { WizardMessage, WizardContext } from "../types";

type State = {
  messages: WizardMessage[];
  isLoading: boolean;
  isGenerating: boolean;
};

type Action =
  | {
      type: "ADD_USER_MESSAGE";
      id: string;
      text: string;
      sourceWidget?: AgentMessage;
    }
  | { type: "ADD_LOADING_MESSAGE"; id: string }
  | { type: "COMPLETE_ASSISTANT"; id: string; data: AgentMessage }
  | { type: "SET_GENERATING"; generating: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: "user",
            text: action.text,
            sourceWidget: action.sourceWidget,
          },
        ],
      };
    case "ADD_LOADING_MESSAGE":
      return {
        ...state,
        isLoading: true,
        messages: [
          ...state.messages,
          {
            id: action.id,
            role: "assistant",
            data: { type: "text", value: "" },
            status: "streaming",
          },
        ],
      };
    case "COMPLETE_ASSISTANT":
      return {
        ...state,
        isLoading: false,
        messages: state.messages.map((m) =>
          m.id === action.id && m.role === "assistant"
            ? { ...m, data: action.data, status: "complete" }
            : m
        ),
      };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.generating };
    default:
      return state;
  }
}

type ApiMessage = { role: "user" | "assistant"; content: string };

function toApiMessages(messages: WizardMessage[]): ApiMessage[] {
  return messages
    .filter(
      (m) => !(m.role === "assistant" && m.status === "streaming")
    )
    .map((m) => {
      if (m.role === "user") {
        return { role: "user" as const, content: m.text };
      }
      return {
        role: "assistant" as const,
        content: JSON.stringify(m.data),
      };
    });
}

function serializeWidget(widget: AgentMessage, answer: unknown): string {
  switch (widget.type) {
    case "radio":
      return `${widget.question}: ${answer}`;
    case "checkbox":
      return `${widget.question}: ${(answer as string[]).join(", ")}`;
    case "slider":
      return `${widget.question}: ${answer}${widget.unit}`;
    case "text_input":
      return `${widget.question}: ${answer}`;
    default:
      return String(answer);
  }
}

interface UseWizardOptions {
  context?: WizardContext;
  onGenerate?: (prompt: string, contentType: string) => void;
}

export interface UseWizardReturn {
  messages: WizardMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  hasPreview: boolean;
  sendMessage: (text: string) => void;
  submitWidget: (widget: AgentMessage, answer: unknown) => void;
  handleGenerate: () => void;
}

export function useWizard({
  context = {},
  onGenerate,
}: UseWizardOptions = {}): UseWizardReturn {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isLoading: false,
    isGenerating: false,
  });

  const messagesRef = useRef<WizardMessage[]>([]);
  messagesRef.current = state.messages;

  const abortRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);

  const sendToAPI = useCallback(
    async (messages: WizardMessage[]) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = crypto.randomUUID();
      dispatch({ type: "ADD_LOADING_MESSAGE", id: assistantId });

      try {
        const response = await fetch("/api/wizard/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: toApiMessages(messages), context }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.statusMessage || err?.message || `Request failed (${response.status})`);
        }

        const data = await response.json();
        const parsed = AgentMessageSchema.safeParse(data.message);
        const agentMessage: AgentMessage = parsed.success
          ? parsed.data
          : { type: "text", value: String(data.message?.value ?? "Unexpected response from AI. Please try again.") };

        dispatch({ type: "COMPLETE_ASSISTANT", id: assistantId, data: agentMessage });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        dispatch({
          type: "COMPLETE_ASSISTANT",
          id: assistantId,
          data: { type: "text", value: `Error: ${(e as Error).message ?? "Something went wrong. Please try again."}` },
        });
      }
    },
    [context]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    sendToAPI([]);
  }, [sendToAPI]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: Extract<WizardMessage, { role: "user" }> = {
        id: crypto.randomUUID(),
        role: "user",
        text,
      };
      dispatch({ type: "ADD_USER_MESSAGE", id: userMsg.id, text });
      sendToAPI([...messagesRef.current, userMsg]);
    },
    [sendToAPI]
  );

  const submitWidget = useCallback(
    (widget: AgentMessage, answer: unknown) => {
      const text = serializeWidget(widget, answer);
      const userMsg: Extract<WizardMessage, { role: "user" }> = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        sourceWidget: widget,
      };
      dispatch({
        type: "ADD_USER_MESSAGE",
        id: userMsg.id,
        text,
        sourceWidget: widget,
      });
      sendToAPI([...messagesRef.current, userMsg]);
    },
    [sendToAPI]
  );

  type AssistantMessage = Extract<WizardMessage, { role: "assistant" }>;

  const lastPreview = [...state.messages]
    .reverse()
    .find((m): m is AssistantMessage =>
      m.role === "assistant" &&
      (m as AssistantMessage).status === "complete" &&
      (m as AssistantMessage).data.type === "preview"
    );

  const hasPreview = Boolean(lastPreview);

  const handleGenerate = useCallback(() => {
    const preview = lastPreview;
    if (preview && preview.status === "complete" && preview.data.type === "preview") {
      dispatch({ type: "SET_GENERATING", generating: true });
      onGenerate?.(preview.data.prompt, preview.data.contentType);
    } else {
      sendMessage("Generate now");
    }
  }, [lastPreview, onGenerate, sendMessage]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isGenerating: state.isGenerating,
    hasPreview,
    sendMessage,
    submitWidget,
    handleGenerate,
  };
}
