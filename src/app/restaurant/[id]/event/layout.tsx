import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = cookies().get("gruppy_restaurant_session");
  if (session?.value !== params.id) {
    redirect(`/restaurant/${params.id}`);
  }
  return <>{children}</>;
}
