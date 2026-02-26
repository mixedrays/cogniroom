import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import AppSidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { SettingsProvider } from "@/modules/settings";
import type { RouterContext } from "@/lib/routerContext";
import appCss from "../styles.css?url";
import { CSS_THEMES, ThemeInitScriptElement } from "@/modules/color-themes";

export const Route = createRootRouteWithContext<RouterContext>()({
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
});

function RootComponent() {
  const router = useRouter();
  const queryClient = router.options.context.queryClient;

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <SidebarProvider>
            <AppSidebar />

            <main className="flex-1 flex flex-col min-w-0 bg-background text-foreground h-screen overflow-hidden">
              <Outlet />
            </main>

            <RightSidebar />
          </SidebarProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </RootDocument>
  );
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
