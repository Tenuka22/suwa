import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zen-doc/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zen-doc/ui/components/tabs";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { Badge } from "@zen-doc/ui/components/badge";
import {
	Clock,
	Plus,
	Search,
	Upload,
	Video,
	ListMusic,
	Grid2X2
} from "lucide-react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/hub")({
	loader: async ({ context }) => {
		const [stats, files] = await Promise.all([
			context.queryClient.ensureQueryData(orpc.profileStats.queryOptions()),
			context.queryClient.ensureQueryData(orpc.myDoctorFiles.queryOptions()),
		]);
		return { stats, files };
	},
	component: DoctorHubPage,
});

function DoctorHubPage() {
	const { files } = Route.useLoaderData() ;

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			{/* Header / Search Bar */}
			<header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur border-b border-border/40">
				<div className="flex items-center gap-4 flex-1 max-w-2xl">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search your materials..."
							className="pl-10 h-10 rounded-full bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
						/>
					</div>
				</div>
				<div className="flex items-center gap-3 ml-4">
					<Button variant="ghost" size="icon" className="rounded-full">
						<Upload className="size-5" />
					</Button>
					<Button className="rounded-full gap-2 px-4 bg-primary hover:bg-primary/90">
						<Plus className="size-4" />
						<span>Create</span>
					</Button>
				</div>
			</header>

			<main className="flex-1 p-6 space-y-8">
				{/* Top Navigation & Filters */}
				<Tabs defaultValue="all" className="w-full">
					<div className="flex items-center justify-between mb-6">
						<TabsList className="bg-transparent border-none p-0 gap-2 h-auto">
							<TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-active:bg-foreground data-active:text-background border border-border/60">
								All
							</TabsTrigger>
							<TabsTrigger value="videos" className="rounded-full px-4 py-1.5 data-active:bg-foreground data-active:text-background border border-border/60">
								Videos
							</TabsTrigger>
							<TabsTrigger value="podcasts" className="rounded-full px-4 py-1.5 data-active:bg-foreground data-active:text-background border border-border/60">
								Podcasts
							</TabsTrigger>
						</TabsList>
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
								<Grid2X2 className="size-4" />
							</Button>
							<Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
								<ListMusic className="size-4" />
							</Button>
						</div>
					</div>

					<TabsContent value="all" className="mt-0">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
							{files.map((file) => (
								<Card key={file.id} className="group relative border-none bg-transparent shadow-none cursor-pointer">
									<CardContent className="p-0">
										<div className="aspect-video rounded-xl bg-muted/20 flex flex-col items-center justify-center border border-border/40 overflow-hidden relative">
											{file.fileKind === "intro_video" ? (
												<Video className="size-8 text-muted-foreground" />
											) : (
												<Clock className="size-8 text-muted-foreground" />
											)}
											<Badge className="absolute bottom-2 right-2 bg-background/80 backdrop-blur text-[10px]" variant="outline">
												{file.fileKind.replace("_", " ")}
											</Badge>
										</div>
										<div className="mt-3 flex gap-3">
											<div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
												<span className="text-[10px] font-bold">{file.fileKind[0].toUpperCase()}</span>
											</div>
											<div className="flex flex-col gap-1">
												<h3 className="font-semibold leading-none pt-1 truncate">{file.caption || "Untitled Material"}</h3>
												<p className="text-xs text-muted-foreground">Uploaded recently</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>
				</Tabs>
			</main>

			{/* Floating Upload Overlay / Modal Trigger */}
			<section className="fixed bottom-8 right-8">
				<Button size="lg" className="rounded-full shadow-2xl shadow-primary/40 h-14 px-6 gap-3">
					<Upload className="size-5" />
					<span className="font-semibold">Quick Upload</span>
				</Button>
			</section>
		</div>
	);
}
