import Link from "next/link";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";

/**
 * CTASection — reusable call-to-action band used at the bottom of pages.
 */
export default function CTASection({
  title,
  text,
  buttonLabel = "Request a Quote",
  buttonHref,
}: {
  title: string;
  text?: string;
  buttonLabel?: string;
  buttonHref?: string;
}) {
  return (
    <section className="bg-brand-dark">
      <div className="container flex flex-col items-center gap-6 py-16 text-center">
        <Reveal className="flex flex-col items-center gap-6">
          <h2 className="max-w-2xl text-3xl font-bold text-white md:text-4xl">
            {title}
          </h2>
          {text && <p className="max-w-xl text-slate-300">{text}</p>}
          <Button asChild variant="accent" size="lg">
            <Link href={buttonHref?? "/contact"}>{buttonLabel}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
