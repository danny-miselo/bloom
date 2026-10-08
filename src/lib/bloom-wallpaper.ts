import type { Board } from "./bloom-types";
import { download } from "./bloom-vault";

export const layouts = ["Dreamy Collage", "Minimal Luxury", "Polaroid", "Scrapbook", "Floral", "Clean Grid"];
export const boardBackground = (layout: string) => ({ "Dreamy Collage": "#f3e7df", "Minimal Luxury": "#fcf9f3", Polaroid: "#e9e7db", Scrapbook: "#ead7c7", Floral: "#f3e2e5", "Clean Grid": "#f9f6f0" }[layout] || "#f3e7df");
export async function exportWallpaper(board: Board) {
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = boardBackground(board.layout); ctx.fillRect(0, 0, 1080, 1920);
  for (const item of board.items) {
    const x = item.x / 100 * 1080, y = item.y / 100 * 1920, width = item.width / 100 * 1080, height = item.height / 100 * 1920;
    if (item.type === "image") {
      if (!item.content.startsWith("data:image/") && !item.content.startsWith("/assets/")) continue;
      const image = new Image(); image.src = item.content; await image.decode();
      const frame = board.layout === "Polaroid" ? 14 : board.layout === "Scrapbook" ? 8 : 0;
      if (frame) { ctx.fillStyle = "#fffdf8"; ctx.fillRect(x, y, width, height); }
      const iw = width - frame * 2, ih = height - frame * 2;
      const scale = Math.max(iw / image.width, ih / image.height);
      const sw = iw / scale, sh = ih / scale;
      const sx = (image.width - sw) / 2, sy = (image.height - sh) * item.crop / 100;
      ctx.save(); ctx.beginPath(); ctx.rect(x + frame, y + frame, iw, ih); ctx.clip();
      ctx.drawImage(image, sx, sy, sw, sh, x + frame, y + frame, iw, ih); ctx.restore();
    } else {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
      ctx.fillStyle = "#fff9f2"; ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#8f4559"; ctx.font = "italic 48px Georgia"; ctx.textAlign = "center";
      const lines: string[] = [];
      for (const paragraph of item.content.split("\n")) {
        let line = "";
        for (const word of paragraph.split(" ")) { if (ctx.measureText(`${line} ${word}`).width > width - 24 && line) { lines.push(line); line = word; } else line += `${line ? " " : ""}${word}`; }
        lines.push(line);
      }
      lines.forEach((line, index) => ctx.fillText(line, x + width / 2, y + height / 2 - (lines.length - 1) * 30 + index * 60));
      ctx.restore();
    }
  }
  await new Promise<void>((resolve, reject) => canvas.toBlob(blob => { if (blob) { download(blob, `bloom-${board.name.replace(/[^a-z0-9]/gi, "-")}-wallpaper.png`); resolve(); } else reject(new Error("The wallpaper could not be exported.")); }, "image/png"));
}
