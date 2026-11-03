import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { getBranches } from "@/lib/data";

export const metadata = { title: "Track an order" };

export default async function TrackPage() {
  const branches = await getBranches();
  return (
    <>
      <Nav dark={false} />
      <main className="bg-cream pt-[104px] pb-20">
        <div className="wrap max-w-xl">
          <p className="eyebrow text-red">Tracking</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none md:text-5xl">Find your order</h1>
          <p className="mt-3 text-ink/60">Use the link in your confirmation email, or enter the order number and the tracking code from it.</p>
          <form action="/track/go" className="card mt-6 grid gap-4 p-6">
            <div><label className="label" htmlFor="n">Order number</label><input id="n" name="n" required className="input font-mono uppercase" placeholder="JT-MAIN-00012" /></div>
            <div><label className="label" htmlFor="t">Tracking code</label><input id="t" name="t" required className="input font-mono" placeholder="from your email" /></div>
            <button className="btn btn-red">Track</button>
          </form>
        </div>
      </main>
      <Footer branches={branches} />
    </>
  );
}
