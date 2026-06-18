import { Text, type TextProps } from "react-native";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export const H1 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h1 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const H2 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h2 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const H3 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h3 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const H4 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h4 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const H5 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h5 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const H6 = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-h6 ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const Body = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-body ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const BodySm = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-body-sm ${className ?? ""}`} {...props}>
    {children}
  </Text>
);

export const Label = ({ children, className, ...props }: TypographyProps) => (
  <Text className={`text-label ${className ?? ""}`} {...props}>
    {children}
  </Text>
);
