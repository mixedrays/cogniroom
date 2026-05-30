import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentBubble } from "../ContentBubble";
import type { Course, NormalizedCourse } from "@/lib/types";
import * as coursesApi from "@/lib/courses";

vi.mock("@/lib/courses", () => ({
  listCourses: vi.fn(),
  getCourse: vi.fn(),
  saveCourse: vi.fn(),
  saveLessonContent: vi.fn(),
  saveLessonQuiz: vi.fn(),
  saveLessonFlashcards: vi.fn(),
  saveLessonExercises: vi.fn(),
}));

const roadmapPreview: NormalizedCourse = {
  title: "React Fundamentals",
  description: "Build a strong foundation in React.",
  topics: [
    {
      title: "Core Concepts",
      description: "The main React building blocks.",
      lessons: [
        {
          title: "JSX Basics",
          description: "Learn how JSX maps to UI.",
        },
      ],
    },
  ],
};

const savedCourse: Course = {
  id: "react-fundamentals",
  title: roadmapPreview.title,
  description: roadmapPreview.description,
  createdAt: "2026-04-02T10:00:00.000Z",
  updatedAt: "2026-04-02T10:00:00.000Z",
  source: "llm",
  topics: [
    {
      id: "core-concepts",
      title: roadmapPreview.topics[0].title,
      description: roadmapPreview.topics[0].description,
      lessons: [
        {
          id: "jsx-basics",
          title: roadmapPreview.topics[0].lessons[0].title,
          description: roadmapPreview.topics[0].lessons[0].description,
        },
      ],
    },
  ],
};

function renderWidget() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ContentBubble
        type="roadmap"
        params={{ content: roadmapPreview }}
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    </QueryClientProvider>
  );
}

function deferredPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("ContentBubble", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps roadmap save enabled after reload when the same roadmap already exists", async () => {
    vi.mocked(coursesApi.listCourses).mockResolvedValue([
      {
        id: savedCourse.id,
        title: savedCourse.title,
        description: savedCourse.description,
        createdAt: savedCourse.createdAt,
        updatedAt: savedCourse.updatedAt,
        source: savedCourse.source,
        topicCount: savedCourse.topics.length,
        lessonCount: 1,
        completedCount: 0,
        progress: 0,
      },
    ]);
    vi.mocked(coursesApi.getCourse).mockResolvedValue(savedCourse);

    renderWidget();

    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save again" })).toBeEnabled();
    expect(coursesApi.getCourse).toHaveBeenCalledWith(savedCourse.id);
  });

  it("keeps roadmap save enabled after a successful save", async () => {
    vi.mocked(coursesApi.listCourses).mockResolvedValue([]);
    vi.mocked(coursesApi.getCourse).mockResolvedValue(null);
    vi.mocked(coursesApi.saveCourse).mockResolvedValue({
      success: true,
      id: "react-fundamentals-copy",
    });

    renderWidget();

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save again" })).toBeEnabled();
    expect(coursesApi.saveCourse).toHaveBeenCalledTimes(1);
  });

  it("keeps save enabled when a same-title course has different content", async () => {
    vi.mocked(coursesApi.listCourses).mockResolvedValue([
      {
        id: savedCourse.id,
        title: savedCourse.title,
        description: savedCourse.description,
        createdAt: savedCourse.createdAt,
        updatedAt: savedCourse.updatedAt,
        source: savedCourse.source,
        topicCount: savedCourse.topics.length,
        lessonCount: 1,
        completedCount: 0,
        progress: 0,
      },
    ]);
    vi.mocked(coursesApi.getCourse).mockResolvedValue({
      ...savedCourse,
      topics: [
        {
          ...savedCourse.topics[0],
          lessons: [
            {
              ...savedCourse.topics[0].lessons[0],
              title: "Hooks Deep Dive",
            },
          ],
        },
      ],
    });

    renderWidget();

    expect(await screen.findByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("shows a disabled save button when a pending roadmap bubble becomes superseded", async () => {
    const pendingCourses =
      deferredPromise<Awaited<ReturnType<typeof coursesApi.listCourses>>>();
    vi.mocked(coursesApi.listCourses).mockReturnValue(pendingCourses.promise);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContentBubble
          type="roadmap"
          params={{ content: roadmapPreview }}
          onSubmit={vi.fn()}
          onDismiss={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("button", { name: "Checking…" })
    ).toBeDisabled();

    rerender(
      <QueryClientProvider client={queryClient}>
        <ContentBubble
          type="roadmap"
          params={{ content: roadmapPreview }}
          onSubmit={vi.fn()}
          onDismiss={vi.fn()}
          superseded
        />
      </QueryClientProvider>
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    pendingCourses.resolve([]);
  });
});
