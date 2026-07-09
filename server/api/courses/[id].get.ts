import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { courseRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load course", async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing course ID" });
    }

    const course = await courseRepo.getCourse(storageApi, id);
    if (!course) {
      throw new HTTPError({ status: 404, message: "Course not found" });
    }
    return course;
  })
);
