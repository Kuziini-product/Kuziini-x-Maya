import { createCanvas, loadImage } from "canvas";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [192, 512];

async function generate() {
  const logo = await loadImage(resolve(__dirname, "../public/kuziini-logo.png"));
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    // Dark background
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, size, size);
    // Center logo with padding
    const pad = Math.round(size * 0.15);
    const s = size - pad * 2;
    ctx.drawImage(logo, pad, pad, s, s);
    const buf = canvas.toBuffer("image/png");
    const out = resolve(__dirname, `../public/icons/icon-${size}.png`);
    writeFileSync(out, buf);
    console.log(`Created ${out}`);
  }
}

generate().catch(console.error);
