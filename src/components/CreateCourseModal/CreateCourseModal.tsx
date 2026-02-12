import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  FileJson,
  Link as LinkIcon,
  Loader2,
  Plus,
} from "lucide-react";
import type { Course } from "@/lib/types";
import { generateId } from "@/lib/types";
import {
  generateCourse,
  saveCourse,
  type CourseSkillLevel,
} from "@/lib/courses";
import {
  AVAILABLE_MODELS,
  getModelLabelWithPrice,
  getValidModel,
} from "@/lib/llmModels";
import { useSettings } from "@/context/SettingsContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptPreview } from "@/components/PromptPreview/PromptPreview";
interface CreateCourseModalProps {
  onCreated: (course: Course) => void;
}

export default function CreateCourseModal({
  onCreated,
}: CreateCourseModalProps) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("generate");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate tab state
  const [skillTopic, setSkillTopic] = useState("");
  const [skillLevel, setSkillLevel] = useState<CourseSkillLevel>("beginner");

  const [model, setModel] = useState<string>(() =>
    getValidModel(settings.llm.defaultModel)
  );

  useEffect(() => {
    setModel(getValidModel(settings.llm.defaultModel));
  }, [settings.llm.defaultModel]);

  // Import tab state
  const [importJson, setImportJson] = useState("");

  // Extract tab state
  const [extractUrl, setExtractUrl] = useState("");

  const handleGenerate = async () => {
    if (!skillTopic.trim()) {
      setError("Please enter a skill topic");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const gen = await generateCourse({
        topic: skillTopic,
        level: skillLevel,
        model,
      });

      if (!gen.success || !gen.course) {
        setError(gen.error || "Failed to generate course");
        return;
      }

      const course: Course = gen.course;

      const save = await saveCourse(course);
      if (!save.success) {
        setError(save.error || "Failed to save course");
        return;
      }

      onCreated(course);
      resetForm();
    } catch (e) {
      setError("An error occurred while creating the course");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      setError("Please paste JSON content");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(importJson);
      const now = new Date().toISOString();

      // Create course from imported JSON
      const course: Course = {
        id: generateId(),
        title: parsed.title || "Imported Course",
        description: parsed.description || "",
        createdAt: now,
        updatedAt: now,
        source: "import",
        topics: Array.isArray(parsed.topics)
          ? parsed.topics.map((topic: any) => ({
              id: topic.id || generateId(),
              title: topic.title || "Untitled Topic",
              description: topic.description || "",
              lessons: Array.isArray(topic.lessons)
                ? topic.lessons.map((lesson: any) => ({
                    id: lesson.id || generateId(),
                    title: lesson.title || "Untitled Lesson",
                    description: lesson.description || "",
                    completed: false,
                  }))
                : [],
            }))
          : [],
      };

      const result = await saveCourse(course);
      if (result.success) {
        onCreated(course);
        resetForm();
      } else {
        setError("Failed to save course");
      }
    } catch (e) {
      setError("Invalid JSON format");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!extractUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    // URL validation
    try {
      new URL(extractUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, create a placeholder course
      // URL extraction with AI will be added later
      const now = new Date().toISOString();
      const course: Course = {
        id: generateId(),
        title: `Course from URL`,
        description: `Extracted from: ${extractUrl}`,
        createdAt: now,
        updatedAt: now,
        source: "extract",
        sourceUrl: extractUrl,
        topics: [
          {
            id: generateId(),
            title: "Extracted Content",
            description: "Topics extracted from the provided URL",
            lessons: [
              {
                id: generateId(),
                title: "Overview",
                description: "Content overview from the source",
                completed: false,
              },
            ],
          },
        ],
      };

      const result = await saveCourse(course);
      if (result.success) {
        onCreated(course);
        resetForm();
      } else {
        setError("Failed to save course");
      }
    } catch (e) {
      setError("An error occurred while extracting from URL");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSkillTopic("");
    setSkillLevel("beginner");
    setModel(getValidModel(settings.llm.defaultModel));
    setImportJson("");
    setExtractUrl("");
    setError(null);
  };

  const coursePromptVariables = useMemo(
    () => ({ topic: skillTopic, level: skillLevel }),
    [skillTopic, skillLevel]
  );

  console.log(
    "Default model:",
    settings.llm.defaultModel,
    "Using model:",
    model
  );

  return (
    <Dialog>
      <Button render={DialogTrigger} className="w-full">
        <Plus />
        <span>Create Course</span>
      </Button>

      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="import">
              <FileJson className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="extract">
              <LinkIcon className="w-4 h-4 mr-2" />
              Extract
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {error && (
              <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <TabsContent value="generate" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="topic">What skill do you want to learn?</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Python, SQL, React, Machine Learning"
                  value={skillTopic}
                  onChange={(e) => setSkillTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Your current level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(value: any) => setSkillLevel(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={model}
                  onValueChange={(value: any) => setModel(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    {Object.entries(AVAILABLE_MODELS).map(([value, stats]) => (
                      <SelectItem key={value} value={value}>
                        {getModelLabelWithPrice(stats)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <PromptPreview
                promptId="course-generation"
                variables={coursePromptVariables}
              />
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Course
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="json">Paste course JSON</Label>
                <Textarea
                  id="json"
                  placeholder='{"title": "My Course", "topics": [...]}'
                  className="font-mono text-sm min-h-37.5"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                />
              </div>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4 mr-2" />
                    Import Course
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="extract" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="url">Enter URL to extract from</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or documentation URL"
                  value={extractUrl}
                  onChange={(e) => setExtractUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Works with YouTube tutorials, documentation pages, and other
                  learning resources.
                </p>
              </div>
              <Button
                onClick={handleExtract}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Extract Course
                  </>
                )}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
