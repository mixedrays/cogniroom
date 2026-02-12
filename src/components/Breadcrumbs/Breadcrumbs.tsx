import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BreadcrumbLinkTarget =
  | string
  | {
      to: string;
      params?: Record<string, string>;
    };

export type BreadcrumbItemConfig = {
  title: string;
  link?: BreadcrumbLinkTarget;
  current?: boolean;
};

export type BreadcrumbsProps = {
  items: Array<BreadcrumbItemConfig | BreadcrumbItemConfig[]>;
  className?: string;
};

const renderBreadcrumbLink = (item: BreadcrumbItemConfig, isLast: boolean) => {
  if (item.link) {
    if (typeof item.link === "string") {
      return (
        <BreadcrumbLink
          render={
            <Link to={item.link} className="truncate">
              {item.title}
            </Link>
          }
        />
      );
    }

    return (
      <BreadcrumbLink
        render={
          <Link
            to={item.link.to}
            params={item.link.params}
            className="truncate"
          >
            {item.title}
          </Link>
        }
      />
    );
  }

  if (isLast) {
    return <BreadcrumbPage className="truncate">{item.title}</BreadcrumbPage>;
  }

  return <span className="text-muted-foreground truncate">{item.title}</span>;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isDropdown = Array.isArray(item);
          const dropdownItems = isDropdown
            ? (item as BreadcrumbItemConfig[])
            : null;
          const dropdownCurrent = dropdownItems
            ? (dropdownItems.find((entry) => entry.current) ?? dropdownItems[0])
            : null;

          return (
            <BreadcrumbItem key={`breadcrumb-${index}`} className="min-w-0">
              {index > 0 && <BreadcrumbSeparator />}
              {isDropdown ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground truncate">
                      {dropdownCurrent?.title ?? ""}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Toggle breadcrumb menu</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {dropdownItems?.map((dropdownItem, dropdownIndex) => (
                      <DropdownMenuItem
                        key={`breadcrumb-dropdown-${index}-${dropdownIndex}`}
                      >
                        {dropdownItem.link ? (
                          typeof dropdownItem.link === "string" ? (
                            <Link
                              to={dropdownItem.link}
                              className="flex w-full items-center"
                            >
                              {dropdownItem.title}
                            </Link>
                          ) : (
                            <Link
                              to={dropdownItem.link.to}
                              params={dropdownItem.link.params}
                              className="flex w-full items-center"
                            >
                              {dropdownItem.title}
                            </Link>
                          )
                        ) : (
                          <span className="flex w-full items-center">
                            {dropdownItem.title}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                renderBreadcrumbLink(item as BreadcrumbItemConfig, isLast)
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
