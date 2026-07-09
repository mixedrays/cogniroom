import { defineEventHandler } from "h3";
import { storageApi } from "@modules/storage";
import { courseRepo } from "@modules/repository";

export default defineEventHandler(async () => {
  try {
    return await courseRepo.listCourses(storageApi);
  } catch (error: unknown) {
    console.error("Error listing courses:", error);
    return [];
  }
});
