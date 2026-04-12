import { BottomNav } from "@/components/layout/BottomNav";
import { OnlinePing } from "@/components/layout/OnlinePing";

export default function UmbrellaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { umbrellaId: string };
}) {
  return (
    <div className="min-h-dvh bg-maya-dark">
      <main className="pb-24">{children}</main>
      <BottomNav umbrellaId={params.umbrellaId} />
      <OnlinePing />
    </div>
  );
}
