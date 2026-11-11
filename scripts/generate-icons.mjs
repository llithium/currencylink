/* global Image, document */
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "@playwright/test";

// Keep every raster icon derived from the SVG used by the header and favicon.
const publicDirectory = new URL("../public/", import.meta.url);
const svg = await readFile(new URL("favicon.svg", publicDirectory), "utf8");
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  for (const [filename, size] of [
    ["favicon-16.png", 16],
    ["favicon-32.png", 32],
    ["favicon-48.png", 48],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    const data = await page.evaluate(
      async ({ svg, size }) => {
        const image = new Image();
        image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create the icon canvas");
        context.drawImage(image, 0, 0, size, size);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { svg, size },
    );
    await writeFile(
      new URL(filename, publicDirectory),
      Buffer.from(data, "base64"),
    );
  }
} finally {
  await browser.close();
}
