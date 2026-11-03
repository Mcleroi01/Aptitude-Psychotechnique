import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollMotion } from "@/components/motion/scroll-motion";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <ScrollMotion>{children}</ScrollMotion>
      </main>
      <SiteFooter />
    </>
  );
}
