import React, { useState, useEffect, useRef } from "react";

export default function BarcodeInput({ onScan, disabled = false }) {

  const [barcode, setBarcode] = useState("");
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const lastKeyTime = useRef(0);

  const lastScanned = useRef({ code: "", time: 0 });

  // ✅ ONLY focus when enabled (no force loops)
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const playSuccess = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
      audio.volume = 0.2;
      audio.play();
    } catch {}
  };

  const playError = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.volume = 0.3;
      audio.play();
    } catch {}
  };

  const processScan = (code) => {
    if (!code || disabled) return;

    const now = Date.now();

    const isDuplicate =
      lastScanned.current.code === code &&
      now - lastScanned.current.time < 800;

    lastScanned.current = { code, time: now };

    try {
      const result = onScan?.(code, { duplicate: isDuplicate });

      if (result === false) {
        playError();
      } else {
        playSuccess();
      }
    } catch {
      playError();
    }

    setBarcode("");

    // ✅ SAFE: focus AFTER scan only
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (e) => {
    if (disabled) return;

    const value = e.target.value;
    const now = Date.now();

    setBarcode(value);

    const timeDiff = now - lastKeyTime.current;
    lastKeyTime.current = now;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const isScannerSpeed = timeDiff < 30;

    timerRef.current = setTimeout(() => {
      const code = value.trim();

      if (code.length >= 4) {
        processScan(code);
      }
    }, isScannerSpeed ? 30 : 200);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter") {
      processScan(barcode.trim());
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={disabled ? "Payment mode..." : "Scan barcode..."}
      value={barcode}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "15px",
        fontSize: "18px",
        outline: "none",
        border: disabled ? "2px solid #ccc" : "2px solid #007bff",
        borderRadius: "6px",
        backgroundColor: disabled ? "#f5f5f5" : "white"
      }}
    />
  );
}
