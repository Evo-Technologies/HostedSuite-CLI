import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

import { setLastWriteTenant } from "../config.js";
import { findEntity } from "../entities.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { requestMultipart, requestRaw } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive, writePreamble } from "./entity.js";

/** Client-side content-type guard: the server accepts image/* uploads only. */
const IMAGE_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".heic": "image/heic",
};

export function buildFileCommand(): Command {
  const root = new Command("file").description("Download and upload HostedSuite file references (v3 /files).");

  // ---- file get <fileId> --out <path> -------------------------------------
  addGlobalFlags(root.command("get"))
    .argument("<fileId>", "The file id (from a FileReference field, e.g. logoId/photoId)")
    .description("Download a file by id (GET /files/{id}) and stream it to --out.")
    .addHelpText("after", "\nExample:\n  hs file get <fileId> --out logo.png\n")
    .action(async (fileId: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      if (resolved.profile.apiVersion !== "v3") {
        throw new CliError(EXIT.NOT_IMPLEMENTED, `File download requires a v3 tenant; ${resolved.alias} runs the v2 API.`);
      }
      if (!globals.out) {
        throw new CliError(EXIT.USAGE, "--out <path> is required (file downloads are binary and stream to disk).");
      }
      const filePath = `/files/${encodeURIComponent(fileId)}`;
      if (globals.dryRun) {
        emit({ dryRun: true, method: "GET", path: filePath, tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
        return;
      }
      const res = await requestRaw(resolved.profile, { method: "GET", path: filePath, timeoutMs: parseTimeout(globals) });
      const resolvedOut = path.resolve(globals.out);
      fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(resolvedOut, buf);
      process.stdout.write(`${JSON.stringify({ path: resolvedOut, bytes: buf.byteLength })}\n`);
    });

  // ---- file upload <entity> <id> <field> -f <path> ------------------------
  addGlobalFlags(root.command("upload"))
    .argument("<entity>", "Entity noun the file attaches to, e.g. center, contact, meeting-room")
    .argument("<id>", "Entity id")
    .argument("<field>", "File-reference field/route segment, e.g. invoiceLogo, photo, pictures")
    .description("Upload one image file to an entity's file field (multipart; image/* only, exactly one file).")
    .requiredOption("-f, --file <path>", "Path to the image file to upload")
    .addHelpText(
      "after",
      "\nExample:\n  hs file upload center <id> invoiceLogo -f logo.png\n\n" +
        "Safety:\n  Single write — prints the tenant banner and a recent-switch note. The server accepts image/* only; " +
        "the CLI validates the content-type client-side and refuses non-images before calling.\n",
    )
    .action(async (entity: string, id: string, field: string, opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      if (resolved.profile.apiVersion !== "v3") {
        throw new CliError(EXIT.NOT_IMPLEMENTED, `File upload requires a v3 tenant; ${resolved.alias} runs the v2 API.`);
      }

      const def = findEntity(entity);
      if (!def || !def.v3) {
        throw new CliError(EXIT.USAGE, `Unknown or non-v3 entity "${entity}". Run \`hs schema\` to see entity nouns.`);
      }

      const contentType = imageContentType(opts.file);
      if (!contentType) {
        throw new CliError(
          EXIT.USAGE,
          `"${opts.file}" is not a recognized image. The server accepts image/* only (png, jpg, gif, webp, bmp, tiff, svg).`,
        );
      }

      const uploadPath = `${def.v3.uriBase}/${encodeURIComponent(id)}/${field}`;

      if (globals.dryRun) {
        emit(
          {
            dryRun: true,
            method: "POST",
            path: uploadPath,
            file: path.resolve(opts.file),
            contentType,
            tenant: { alias: resolved.alias, apiVersion: "v3" },
          },
          globals,
        );
        return;
      }

      let bytes: Buffer;
      try {
        bytes = fs.readFileSync(opts.file);
      } catch (err) {
        throw new CliError(EXIT.USAGE, `Cannot read "${opts.file}": ${(err as Error).message}`);
      }

      writePreamble(cfg, resolved, globals);

      const form = new FormData();
      const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
      form.append("file", blob, path.basename(opts.file));

      const res = await requestMultipart(resolved.profile, {
        method: "POST",
        path: uploadPath,
        form,
        timeoutMs: parseTimeout(globals),
      });
      setLastWriteTenant(resolved.alias);
      emit(normalizeResponse(res.data, "v3", !!globals.raw), globals);
    });

  return root;
}

function imageContentType(file: string): string | undefined {
  return IMAGE_EXT[path.extname(file).toLowerCase()];
}
