'use client';

import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Text } from "react-native";

interface TextLinkProps {
  children: ReactNode;
  href: Href;
}

export const TextLink = ({ children, href }: TextLinkProps) => (
  <Link href={href}>
    <Text className="font-bold font-sans text-primary underline decoration-2">
      {children}
    </Text>
  </Link>
);
