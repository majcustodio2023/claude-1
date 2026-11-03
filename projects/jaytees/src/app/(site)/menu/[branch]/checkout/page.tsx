import { notFound } from "next/navigation";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import CheckoutForm from "@/components/site/CheckoutForm";
import ModeSync from "@/components/site/ModeSync";
import { getBranch, getBranches } from "@/lib/data";

export const revalidate = 60;
export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params, searchParams }: PageProps<"/menu/[branch]/checkout">) {
  const [{ branch }, sp] = await Promise.all([params, searchParams]);
  const b = await getBranch(branch);
  if (!b) notFound();
  const branches = await getBranches();
  const mode = sp.mode === "pickup" ? "pickup" : "delivery";
  return (
    <>
      <Nav dark={false} />
      <ModeSync mode={mode} />
      <main className="bg-cream pt-[104px] pb-20">
        <div className="wrap">
          <p className="eyebrow text-red">Almost there</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none md:text-5xl">Checkout</h1>
          <div className="mt-8"><CheckoutForm branch={b} /></div>
        </div>
      </main>
      <Footer branches={branches} />
    </>
  );
}
