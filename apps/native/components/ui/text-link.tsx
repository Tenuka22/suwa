import { type Href, Link } from "expo-router";
import type { ReactNode } from "react";
import { Text } from "react-native";

interface TextLinkProps {
  children: ReactNode;
  href: Href;
}

export const TextLink = ({ children, href }: TextLinkProps) => (
  <Link href={href}>
    <Text className="font-medium font-sans text-primary">{children}</Text>
  </Link>
);
