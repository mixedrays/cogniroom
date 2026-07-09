import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import AppSidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "../components/ui/sidebar";
import { SettingsProvider, SettingsDialog } from "@/modules/settings";
import {
  CommandPalette,
  CommandPaletteProvider,
} from "@/modules/command-palette";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import type { RouterContext } from "@/lib/routerContext";
import appCss from "../styles.css?url";
import { CSS_THEMES, ThemeInitScriptElement } from "@/modules/color-themes";

export const Route = createRootRouteWithContext<RouterContext>()({
  // In browser mode `defaultSsr` is false so data routes render as client-only
  // shells (their loaders read the browser's IndexedDB, absent during SSR). The
  // root must still SSR, though: it emits the `<html>` document and `<Scripts>`
  // that bootstrap the client bundle. Without this the whole page ships empty
  // and nothing ever hydrates. No-op in filesystem mode (defaultSsr already on).
  ssr: true,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: import.meta.env.APP_NAME,
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      ...CSS_THEMES.filter(({ url }) => url).map(({ url }) => ({
        rel: "stylesheet" as const,
        href: url!,
      })),
    ],
  }),

  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  const router = useRouter();
  const queryClient = router.options.context.queryClient;
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <CommandPaletteProvider>
            <SidebarProvider>
              <AppSidebar />

              <main className="flex-1 flex flex-col min-w-0 bg-background text-foreground h-screen overflow-hidden">
                <Outlet />
              </main>
            </SidebarProvider>
            <SettingsDialog />
            <CommandPalette />
          </CommandPaletteProvider>
        </SettingsProvider>
        <Toaster />
        <ServiceWorkerRegistrar />
        <SyncQueueRunner />
      </QueryClientProvider>
    </RootDocument>
  );
}

function SyncQueueRunner() {
  useSyncQueue();
  return null;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: blocking script applies theme classes before hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeInitScriptElement />
      </head>
      <body className="m-0">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          The route you requested does not exist or is no longer available.
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/">Back to home</Link>}
        />
      </div>
    </div>
  );
}
