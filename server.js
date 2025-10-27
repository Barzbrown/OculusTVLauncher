import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const publicDir = join(rootDir, "public");
const defaultFile = join(publicDir, "index.html");

const port = Number.parseInt(process.env.PORT ?? "4173", 10);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = createServer(async (req, res) => {
  try {
    const method = req.method ?? "GET";
    if (!req.url || (method !== "GET" && method !== "HEAD")) {
      res.writeHead(405);
      res.end("Method Not Allowed");
      return;
    }

    const rawPath = decodeURIComponent(req.url.split("?")[0] ?? "/");
    if (rawPath === "/" || rawPath === "") {
      return streamFile(defaultFile, method, res);
    }

    const relativePath = rawPath.replace(/^\/+/, "");
    const normalized = normalize(relativePath);
    if (normalized.startsWith("..")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const candidates = [
      join(publicDir, normalized),
      join(rootDir, normalized),
    ];

    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate);
        if (!stat.isFile()) {
          continue;
        }

        return streamFile(candidate, method, res);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }

    res.writeHead(404);
    res.end("Not Found");
  } catch (error) {
    console.error("Static server error", error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`Serving Oculus TV Launcher on http://localhost:${port}`);
  console.log("Press Ctrl+C to stop the server.");
});

function streamFile(filePath, method, res) {
  const extension = extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] ?? "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (method === "HEAD") {
    res.writeHead(200);
    res.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200);
    stream.pipe(res);
  });
  stream.on("error", (error) => {
    console.error("Stream error", error);
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end("Internal Server Error");
  });
}
