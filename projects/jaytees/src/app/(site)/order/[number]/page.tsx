import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import OrderTracker from "@/components/site/OrderTracker";
import { getBranches } from "@/lib/data";

export const metadata = { title: "Track your order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : "";
  const branches = await getBranches();
  return (
    <>
      <Nav dark={false} />
      <main className="bg-cream pt-[104px] pb-20">
        <div className="wrap">
          <p className="eyebrow text-red">Live tracking</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none md:text-5xl">Your order</h1>
          <div className="mt-8"><OrderTracker number={decodeURIComponent(number)} token={token} isNew={sp.new === "1"} /></div>
        </div>
      </main>
      <Footer branches={branches} />
    </>
  );
}
