import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return { success: false, error: "Missing course ID" };
    }

    // Delete the entire course folder (includes lessons, tests, exercises)
    const response = await storageApi.delete(`courses/${id}`, true);

    if (!response.ok && response.status !== 404) {
      return { success: false, error: response.statusText };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting course:", error);
    return { success: false, error: String(error) };
  }
});
