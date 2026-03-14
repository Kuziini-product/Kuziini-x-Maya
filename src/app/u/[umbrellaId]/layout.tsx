import { BottomNav } from "@/components/layout/BottomNav";

export default function UmbrellaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { umbrellaId: string };
}) {
  return (
    <div className="min-h-dvh bg-cream">
      <main className="pb-24">{children}</main>
      <BottomNav umbrellaId={params.umbrellaId} />
    </div>
  );
}
