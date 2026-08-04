import { redirect } from "next/navigation";
import { checkRestaurantSession } from "@/lib/server-auth";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await checkRestaurantSession(id))) {
    redirect(`/restaurant/${id}`);
  }
  return <>{children}</>;
}
