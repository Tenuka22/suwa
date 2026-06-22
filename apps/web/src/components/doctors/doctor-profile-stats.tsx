import { Card } from "@heroui/react";
import {
  BookOpenIcon,
  FileIcon,
  LanguagesIcon,
  RadioIcon,
  UserCircleIcon,
  VideoIcon,
} from "lucide-react";

interface ProfileStats {
  completenessPercentage?: number | null;
  fileCount?: number | null;
  hubAudioCount?: number | null;
  hubVideoCount?: number | null;
  languageCount?: number | null;
  profileExists?: boolean | null;
  specialtyCount?: number | null;
}

export function DoctorProfileStats({ stats }: { stats?: ProfileStats | null }) {
  const items = [
    {
      icon: UserCircleIcon,
      label: "Profile Completion",
      value: `${stats?.completenessPercentage ?? 0}%`,
      success: (stats?.completenessPercentage ?? 0) > 0,
    },
    {
      icon: FileIcon,
      label: "Files",
      value: `${stats?.fileCount ?? 0}`,
      success: false,
    },
    {
      icon: BookOpenIcon,
      label: "Specialties",
      value: `${stats?.specialtyCount ?? 0}`,
      success: false,
    },
    {
      icon: LanguagesIcon,
      label: "Languages",
      value: `${stats?.languageCount ?? 0}`,
      success: false,
    },
    {
      icon: VideoIcon,
      label: "Hub Videos",
      value: `${stats?.hubVideoCount ?? 0}`,
      success: false,
    },
    {
      icon: RadioIcon,
      label: "Hub Audio",
      value: `${stats?.hubAudioCount ?? 0}`,
      success: false,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card className="border border-border/50 shadow-none" key={item.label}>
          <Card.Content className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center justify-start">
            <item.icon className="size-5 text-muted-foreground opacity-60" />
            <p className="font-semibold text-2xl tabular-nums">{item.value}</p>
            </div>
            <p className="text-muted-foreground text-xs">{item.label}</p>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
