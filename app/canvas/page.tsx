"use client";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

export default function Canvas() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Tldraw />
    </div>
  );
}