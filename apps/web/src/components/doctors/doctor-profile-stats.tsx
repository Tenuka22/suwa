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

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircleIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

export function DoctorProfileStats({
  stats,
}: {
  stats?: ProfileStats | null;
}) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      <StatItem
        icon={UserCircleIcon}
        label={stats?.profileExists ? "in progress" : "not started"}
        value={`${stats?.completenessPercentage ?? 0}%`}
      />
      <StatItem
        icon={FileIcon}
        label="files"
        value={`${stats?.fileCount ?? 0}`}
      />
      <StatItem
        icon={BookOpenIcon}
        label="specialties"
        value={`${stats?.specialtyCount ?? 0}`}
      />
      <StatItem
        icon={LanguagesIcon}
        label="languages"
        value={`${stats?.languageCount ?? 0}`}
      />
      <StatItem
        icon={VideoIcon}
        label="hub videos"
        value={`${stats?.hubVideoCount ?? 0}`}
      />
      <StatItem
        icon={RadioIcon}
        label="hub audio"
        value={`${stats?.hubAudioCount ?? 0}`}
      />
    </div>
  );
}
