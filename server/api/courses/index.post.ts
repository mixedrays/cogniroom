import { defineEventHandler, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";
import { courseCreateSchema } from "@modules/core";
import { courseRepo } from "@modules/repository";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();

    const parsed = courseCreateSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      return { success: false, error: "Invalid course data" };
    }

    return await courseRepo.createCourse(storageApi, parsed.data);
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error saving course:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
