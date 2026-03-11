import MainNav from "@/components/MainNav";
import GachaClient from "@/components/GachaClient";

export default function GachaPage() {
  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <GachaClient />
      </main>
    </>
  );
}
