import { defineEventHandler } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Topic, Lesson } from "@modules/core";

export default defineEventHandler(async () => {
  try {
    // List course directories
    const courseFolders = await storageApi.list("courses", {
      directories: true,
      files: false,
    });

    const courses = await Promise.all(
      courseFolders.map(async (folder) => {
        try {
          const courseAdapter = getFormatAdapter("course");
          const response = await storageApi.get<string>(
            storagePaths.course(folder.name)
          );
          if (!response.ok) return null;
          const course = courseAdapter.deserialize(await response.text());

          // Calculate metadata
          const topicCount = course.topics?.length || 0;
          const lessonCount =
            course.topics?.reduce(
              (acc: number, topic: Topic) => acc + (topic.lessons?.length || 0),
              0
            ) || 0;
          const completedCount =
            course.topics?.reduce(
              (acc: number, topic: Topic) =>
                acc +
                (topic.lessons?.filter((l: Lesson) => l.completed)?.length ||
                  0),
              0
            ) || 0;
          const progress =
            lessonCount > 0
              ? Math.round((completedCount / lessonCount) * 100)
              : 0;

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            source: course.source,
            topicCount,
            lessonCount,
            completedCount,
            progress,
          };
        } catch (error: unknown) {
          console.error(`Error reading course ${folder.name}:`, error);
          return null;
        }
      })
    );

    // Filter out any nulls from failed reads and sort by updatedAt descending
    const validCourses = courses.filter((c) => c !== null);
    validCourses.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return validCourses;
  } catch (error: unknown) {
    console.error("Error listing courses:", error);
    return [];
  }
});
