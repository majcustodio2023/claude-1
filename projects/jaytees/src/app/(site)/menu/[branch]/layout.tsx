import { notFound } from "next/navigation";
import { CartProvider } from "@/components/site/cart";
import { getBranch } from "@/lib/data";

export default async function MenuLayout({ children, params }: LayoutProps<"/menu/[branch]">) {
  const { branch } = await params;
  const b = await getBranch(branch);
  if (!b) notFound();
  return (
    <CartProvider branch={b.slug} initialMode={b.accepts_delivery ? "delivery" : "pickup"}>
      {children}
    </CartProvider>
  );
}
