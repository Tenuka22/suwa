import type * as React from "react";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={`w-full caption-bottom text-sm ${className ?? ""}`}
      {...props}
    />
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return <thead className={`[&_tr]:border-b ${className ?? ""}`} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={`[&_tr:last-child]:border-0 ${className ?? ""}`}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 ${className ?? ""}`}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={`h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className ?? ""}`}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={`p-2 align-middle [&:has([role=checkbox])]:pr-0 ${className ?? ""}`}
      {...props}
    />
  );
}
