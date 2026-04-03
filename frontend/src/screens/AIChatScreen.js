import React, { useState, useRef, useEffect } from "react";
import { API } from "../config";

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input;

    const userMsg = {
      sender: "user",
      text
    };

    // show message instantly
    setMessages(prev => [...prev, userMsg]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await res.json();

      const aiMsg = {
        sender: "ai",
        text: data?.response || "No response from AI"
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);

      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "❌ Error connecting to AI server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        Phoenix AI Assistant
      </div>

      {/* MESSAGES */}
      <div style={styles.messages}>

        {messages.length === 0 && !loading && (
          <div style={styles.welcome}>
            👋 Welcome to Phoenix AI  
            <br />
            Ask anything about your business.
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "8px"
            }}
          >
            <div style={{
              ...styles.bubble,
              background: msg.sender === "user" ? "#DCF8C6" : "#FFFFFF"
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={styles.loadingBubble}>
              🤖 Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your business..."
          disabled={loading}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            ...styles.sendBtn,
            opacity: loading ? 0.6 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f0f2f5"
  },

  header: {
    padding: "15px",
    background: "#075E54",
    color: "white",
    fontWeight: "bold"
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "10px"
  },

  bubble: {
    maxWidth: "70%",
    padding: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
  },

  loadingBubble: {
    background: "#FFFFFF",
    padding: "10px",
    borderRadius: "10px",
    fontStyle: "italic",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
  },

  welcome: {
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #ddd"
  },

  inputArea: {
    display: "flex",
    padding: "10px",
    background: "#fff",
    borderTop: "1px solid #ddd"
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #ccc",
    resize: "none"
  },

  sendBtn: {
    marginLeft: "10px",
    padding: "10px 15px",
    background: "#075E54",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer"
  }
};
