// PATH: backend/src/models/Chat.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String },
  type: { type: String, enum: ["text", "price", "analysis", "chart", "news"], default: "text" },
  analysis: { type: mongoose.Schema.Types.Mixed },
  chartData: { type: mongoose.Schema.Types.Mixed },
  news: { type: [mongoose.Schema.Types.Mixed] },
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema(
  {
    // 👇 EKLENEN KISIM: Sohbeti kullanıcıya bağlayan alan
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimize chat history lookup 
    },
    title: { type: String, default: "" },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", ChatSchema);
export default Chat;