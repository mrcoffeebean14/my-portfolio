import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { profile } from "@/data/profile";

/** The live assistant: /api/chat, answering from src/data only. */

const SUGGESTED = [
  "What has he built with LangGraph?",
  "What did he ship at Corporate Cruise?",
  "Which projects are live?",
];

function textOf(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("")
    // the prompt asks for plain text; this catches the bold markers a model adds anyway
    .replace(/\*\*(.+?)\*\*/g, "$1");
}

export function Assistant() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: q }] });
    setInput("");
  }

  return (
    <div className="ask">
      <div className="ask__bar">
        <span>Ask about {profile.name.split(" ")[0]}</span>
        <span className="mono">Groq · gpt-oss-20b</span>
      </div>

      <div ref={log} className="ask__log" aria-live="polite">
        {messages.length === 0 ? (
          <ul className="ask__try" aria-label="Suggested questions">
            {SUGGESTED.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => ask(q)} disabled={busy}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          messages.map((m) => (
            <p key={m.id} className={m.role === "user" ? "ask__me" : "ask__it"}>
              {textOf(m)}
            </p>
          ))
        )}
        {busy ? (
          <p className="ask__status mono" role="status">
            Thinking
          </p>
        ) : null}
        {error ? (
          <p className="ask__status mono" role="status">
            No answer right now. Email {profile.email} instead.
          </p>
        ) : null}
      </div>

      <form
        className="ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Ask about {profile.name}
        </label>
        <input
          id="ask"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a project, a stack or the internship"
          autoComplete="off"
        />
        <button type="submit" className="btn" disabled={busy || !input.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
