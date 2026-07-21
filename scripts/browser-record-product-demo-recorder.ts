/**
 * Display recorder for product demo (ffmpeg x11grab).
 */
import { join } from "node:path";
import { DEMO_CAPTURE_FPS, DEMO_VIEWPORT, OUT } from "./browser-record-product-demo-shared";
import { writeError } from "./utils/cli-output";
import { resolveProofEnv } from "./utils/proof-script-env";

export type DisplayRecorder = {
  stop: () => Promise<{ mp4Path: string | null; webmPath: string | null }>;
};

const buildX11GrabArgs = (display: string, rawPath: string): string[] => [
  "ffmpeg",
  "-y",
  "-loglevel",
  "error",
  "-f",
  "x11grab",
  "-video_size",
  `${String(DEMO_VIEWPORT.width)}x${String(DEMO_VIEWPORT.height)}`,
  "-framerate",
  String(DEMO_CAPTURE_FPS),
  "-i",
  `${display}.0+0,0`,
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-crf",
  "28",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  rawPath,
];

const encodeWebmFromRaw = async (rawPath: string, webmPath: string): Promise<string | null> => {
  const webmProc = Bun.spawn(
    [
      "ffmpeg",
      "-y",
      "-loglevel",
      "error",
      "-i",
      rawPath,
      "-c:v",
      "libvpx",
      "-b:v",
      "1M",
      "-an",
      webmPath,
    ],
    { stdout: "ignore", stderr: "pipe" },
  );
  const webmCode = await webmProc.exited;
  if (webmCode === 0) return webmPath;
  const err = await new Response(webmProc.stderr).text();
  await writeError(`webm encode failed: ${err.slice(0, 240)}`);
  return null;
};

export const startDisplayRecorder = (): DisplayRecorder => {
  const display = resolveProofEnv("DISPLAY") ?? ":1";
  const mp4Path = join(OUT, "bao-product-demo.mp4");
  const webmPath = join(OUT, "bao-product-demo.webm");
  const rawPath = join(OUT, "raw-segments", "display-capture.mp4");
  const proc = Bun.spawn(buildX11GrabArgs(display, rawPath), {
    stdout: "ignore",
    stderr: "pipe",
  });

  return {
    stop: async () => {
      proc.kill("SIGINT");
      const code = await proc.exited;
      if (code !== 0 && code !== 255) {
        const err = await new Response(proc.stderr).text();
        await writeError(`display capture failed: ${err.slice(0, 240)}`);
        return { mp4Path: null, webmPath: null };
      }
      await Bun.write(mp4Path, Bun.file(rawPath));
      return { mp4Path, webmPath: await encodeWebmFromRaw(rawPath, webmPath) };
    },
  };
};
