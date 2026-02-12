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
import themeCss from "../themes.css?url";

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
      {
        rel: "stylesheet",
        href: themeCss,
      },
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

// Blocking script to prevent theme flash - runs before React hydrates
const themeInitScript = `
(function() {
  try {
    var cached = localStorage.getItem('settings-cache');
    if (cached) {
      var s = JSON.parse(cached);
      var appearance = s.appearance;
      if (appearance) {
        // Apply dark mode
        var mode = appearance.mode;
        var isDark = mode === 'dark' ||
          (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
        // Apply color theme class (neutral is default, no class needed)
        var colorTheme = appearance.colorTheme;
        if (colorTheme && colorTheme !== 'neutral') {
          document.documentElement.classList.add('theme-' + colorTheme);
        }
        // Apply radius
        var radius = appearance.radius;
        if (typeof radius === 'number') {
          document.documentElement.style.setProperty('--radius', radius + 'rem');
        }
      }
    }
  } catch (e) {}
})();
`;

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: blocking script applies theme classes before hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="m-0">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
