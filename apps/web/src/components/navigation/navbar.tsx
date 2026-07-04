"use client";
import { Button } from "@suwa/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@suwa/ui/components/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@suwa/ui/components/navigation-menu";
import { cn } from "@suwa/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Stethoscope, TextAlignJustify } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export type NavigationSection = {
  title: string;
  href: string;
};

const navigationData: NavigationSection[] = [
  {
    title: "About us",
    href: "#",
  },
  {
    title: "Services",
    href: "#",
  },
  {
    title: "Work",
    href: "#",
  },
  {
    title: "Team",
    href: "#",
  },
  {
    title: "Pricing",
    href: "#",
  },
  {
    title: "Awards",
    href: "#",
  },
];

const Navbar = () => {
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  const role = session?.user?.role;

  const AnimatedActionButton = ({
    label,
    icon,
    to,
  }: {
    label: string;
    icon: React.ReactNode;
    to: "/login" | "/onboarding" | "/doctor" | "/doctor/verification";
  }) => (
    <Button
      render={
        <Link to={to}>
          <span className="relative z-10 transition-all duration-500 hover:cursor-pointer" />
          {label}
          <div className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
            {icon}
          </div>
        </Link>
      }
      className="relative text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit overflow-hidden hover:bg-primary/80 hidden lg:flex"
    />
  );

  const ActionButton = () => {
    if (!session) {
      return (
        <AnimatedActionButton
          icon={<ArrowUpRight size={16} />}
          label="Let's Collaborate"
          to="/login"
        />
      );
    }
    if (role === "user") {
      return (
        <AnimatedActionButton
          icon={<ArrowUpRight size={16} />}
          label="Complete Setup"
          to="/onboarding"
        />
      );
    }
    if (role === "pending-doctor") {
      return (
        <AnimatedActionButton
          icon={<Clock size={16} />}
          label="Verification"
          to="/doctor/verification"
        />
      );
    }
    if (role === "doctor") {
      return (
        <AnimatedActionButton
          icon={<Stethoscope size={16} />}
          label="Doctor Hub"
          to="/doctor"
        />
      );
    }
    return null;
  };

  return (
    <div>
      <header className="bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 border-b">
          <nav
            className={cn(
              "w-full flex items-center h-fit justify-between gap-3.5 lg:gap-6 transition-all duration-500 lg:grid lg:grid-cols-[1fr_auto_1fr]",
              sticky
                ? "p-2.5 bg-background/60 backdrop-blur-lg border border-border/40 shadow-2xl shadow-primary/5 rounded-full"
                : "bg-transparent border-transparent"
            )}
          >
            <Link to="#">
              <img src="Logo.png" className="size-12 rounded-full" width={12} height={12} />
            </Link>
              <NavigationMenu className="max-lg:hidden bg-muted p-0.5 rounded-full">
                <NavigationMenuList className="flex gap-0">
                  {navigationData.map((navItem) => (
                    <NavigationMenuItem key={navItem.title}>
                      <NavigationMenuLink
                        href={navItem.href}
                        className="px-2 lg:px-4 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-background outline outline-transparent hover:outline-border hover:shadow-xs transition tracking-normal"
                      >
                        {navItem.title}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
            </NavigationMenu>
            <div className="w-full flex justify-end items-center">
              <ActionButton />
            </div>

            <div className="lg:hidden">
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger className="rounded-full bg-background border border-border p-2 outline-none flex items-center justify-center cursor-pointer transition-colors">
                  <TextAlignJustify size={20} />
                  <span className="sr-only">Menu</span>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2"
                >
                  {!session && (
                    <DropdownMenuItem>
                      <Link className="w-full cursor-pointer text-sm font-medium" to="/login">Let's Collaborate</Link>
                    </DropdownMenuItem>
                  )}
                  {role === "user" && (
                    <DropdownMenuItem>
                      <Link className="w-full cursor-pointer text-sm font-medium" to="/onboarding">Complete Setup</Link>
                    </DropdownMenuItem>
                  )}
                  {role === "pending-doctor" && (
                    <DropdownMenuItem>
                      <Link className="w-full cursor-pointer text-sm font-medium" to="/doctor/verification">Verification</Link>
                    </DropdownMenuItem>
                  )}
                  {role === "doctor" && (
                    <DropdownMenuItem>
                      <Link className="w-full cursor-pointer text-sm font-medium" to="/doctor">Doctor Hub</Link>
                    </DropdownMenuItem>
                  )}
                  {navigationData.map((item) => (
                    <DropdownMenuItem key={item.title}>
                      <a href={item.href} className="w-full cursor-pointer text-sm font-medium">{item.title}</a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
