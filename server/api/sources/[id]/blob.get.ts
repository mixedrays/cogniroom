import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { getSourceBlob } from "@root/server/lib/sources/store";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw new HTTPError({ status: 400, message: "Missing source ID" });

  const blob = await getSourceBlob(id);
  if (!blob) throw new HTTPError({ status: 404, message: "Source not found" });

  return new Response(new Uint8Array(blob.bytes), {
    headers: {
      "Content-Type": blob.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
});
