import { defineEventHandler, readBody } from "h3";
import { storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ id: string }>(event);

    if (!body || !body.id) {
      return { success: false, error: "Invalid course data" };
    }

    // Write course.json (auto-creates parent directories)
    const response = await storageApi.post(`courses/${body.id}/course.json`, body);

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    return { success: true, id: body.id };
  } catch (error) {
    console.error("Error saving course:", error);
    return { success: false, error: String(error) };
  }
});
