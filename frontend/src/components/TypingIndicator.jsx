// TypingIndicator.jsx
import React from "react";// kendi logo yolunu kullan

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-3">

      <div className="flex space-x-2">
        <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce animate-bounce"></span>
      </div>
    </div>
  );
}
