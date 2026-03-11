import { Fragment, type ReactElement, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDownIcon, Dot as IconSeparator } from "lucide-react";
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
import { Tooltip } from "@/components/ui/tooltip.adapter";

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
  icon?: ReactNode;
  tooltip?: string;
};

export type BreadcrumbsProps = {
  items: Array<BreadcrumbItemConfig | BreadcrumbItemConfig[]>;
  className?: string;
};

const renderBreadcrumbLink = (item: BreadcrumbItemConfig, isLast: boolean) => {
  let content: ReactNode;

  if (item.link) {
    if (typeof item.link === "string") {
      content = (
        <BreadcrumbLink
          render={
            <Link to={item.link} className="flex items-center gap-2 truncate">
              {item.icon}
              {item.title}
            </Link>
          }
        />
      );
    } else {
      content = (
        <BreadcrumbLink
          render={
            <Link
              to={item.link.to}
              params={item.link.params}
              className="flex items-center gap-2 truncate"
            >
              {item.icon}
              {item.title}
            </Link>
          }
        />
      );
    }
  } else if (isLast) {
    content = (
      <BreadcrumbPage className="flex items-center gap-2 truncate">
        {item.icon}
        {item.title}
      </BreadcrumbPage>
    );
  } else {
    content = (
      <span className="flex items-center gap-2 text-muted-foreground truncate">
        {item.icon}
        {item.title}
      </span>
    );
  }

  if (item.tooltip) {
    return <Tooltip content={item.tooltip}>{content as ReactElement}</Tooltip>;
  }

  return content;
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
            <Fragment key={`breadcrumb-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <IconSeparator />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem className="min-w-0">
                {isDropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 min-w-0 hover:text-black">
                      <span className="truncate">
                        {dropdownCurrent?.title ?? ""}
                      </span>
                      <ChevronDownIcon className="size-4 shrink-0" />
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
                                className="flex w-full items-center gap-2"
                              >
                                {dropdownItem.icon}
                                {dropdownItem.title}
                              </Link>
                            ) : (
                              <Link
                                to={dropdownItem.link.to}
                                params={dropdownItem.link.params}
                                className="flex w-full items-center gap-2"
                              >
                                {dropdownItem.icon}
                                {dropdownItem.title}
                              </Link>
                            )
                          ) : (
                            <span className="flex w-full items-center gap-2">
                              {dropdownItem.icon}
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
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
