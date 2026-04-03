import React, { useState, useRef, useEffect } from "react";
import { API } from "../config";

export default function AIAssistant({ user, onBack }) {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const isFetchingRef = useRef(false);

  // LOAD HISTORY
  useEffect(() => {
    loadHistory();

    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        loadHistory();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      isFetchingRef.current = true;

      const res = await fetch(`${API}/ai/chat-history`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setMessages(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
      }

    } catch (err) {
      console.error("History error:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND MESSAGE (🔥 FIXED TO USE /ai/query)
  const sendMessage = async (customText = null) => {

    if (loading) return;

    const text = customText || input;
    if (!text.trim()) return;

    const userMessage = {
      sender: "user",
      text
    };

    setMessages(prev => [...prev, userMessage]);
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

      const aiMessage = {
        sender: "ai",
        text: data.response || "No response"
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error(err);

      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "❌ AI server not reachable." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // QUICK ACTIONS
  const quickActions = [
    ["📊 Overview", "How is my business today?"],
    ["💡 Advice", "What should I improve?"],
    ["📈 Sales", "Show sales today"],
    ["💰 Profit", "Show profit"],
    ["📦 Stock", "Check stock risks"],
    ["🔮 Forecast", "Predict future sales and risks"],
    ["📦 Products", "Analyze product performance"],
    ["💰 Pricing", "Analyze pricing strategy"],
    ["🧠 Summary", "Give me business summary"]
  ];

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>←</button>

        <div>
          <div style={styles.title}>Phoenix AI</div>
          <div style={styles.subtitle}>
            {user?.username} ({user?.role})
          </div>
        </div>
      </div>

      {/* CHAT */}
      <div style={styles.chatBody}>

        {messages.length === 0 && (
          <div style={styles.welcomeCard}>
            👋 Welcome to Phoenix AI  
            <br />
            I analyze your business, detect risks, and guide decisions.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              ...styles.bubble,
              background: msg.sender === "user" ? "#FACC15" : "#FFFFFF"
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.loading}>
            🤖 Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* QUICK ACTIONS */}
      <div style={styles.quickWrap}>
        {quickActions.map(([label, text], i) => (
          <button
            key={i}
            onClick={() => sendMessage(text)}
            style={styles.quickBtn}
            disabled={loading}
          >
            {label}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your business..."
          style={styles.input}
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
          onClick={() => sendMessage()}
          style={styles.sendBtn}
          disabled={loading}
        >
          ➤
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
    background: "#F3F4F6"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 15,
    background: "#FFFFFF",
    borderBottom: "1px solid #eee"
  },

  backBtn: {
    border: "none",
    background: "#FACC15",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer"
  },

  title: {
    fontWeight: "bold",
    color: "#111827"
  },

  subtitle: {
    fontSize: 12,
    color: "#6B7280"
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: 20
  },

  bubble: {
    padding: "10px 15px",
    borderRadius: 10,
    maxWidth: "70%",
    marginBottom: 10,
    border: "1px solid #eee"
  },

  welcomeCard: {
    background: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    border: "1px solid #eee",
    marginBottom: 15
  },

  loading: {
    fontStyle: "italic",
    color: "#6B7280"
  },

  quickWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 10,
    background: "#FFFFFF",
    borderTop: "1px solid #eee"
  },

  quickBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: 6,
    background: "#FACC15",
    cursor: "pointer"
  },

  inputArea: {
    display: "flex",
    padding: 10,
    background: "#FFFFFF",
    borderTop: "1px solid #eee"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    resize: "none"
  },

  sendBtn: {
    marginLeft: 10,
    padding: "10px 15px",
    borderRadius: 8,
    border: "none",
    background: "#FACC15",
    cursor: "pointer"
  }
};
