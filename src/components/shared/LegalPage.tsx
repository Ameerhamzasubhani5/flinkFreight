"use client";

import { useApp } from "@/contexts/AppContext";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/motion/Reveal";
import { legal, TBD } from "@/lib/site";
import type { LegalDoc } from "@/lib/legalContent";

/**
 * Renders an imprint or privacy document. Both pages are the same shape — a
 * hero, a reviewed-on date and a run of headed sections — so they share this
 * rather than duplicating the layout twice.
 *
 * Deliberately plain: legal text is read, not skimmed, so it gets a single
 * measured column and no animation past the first reveal.
 */
export default function LegalPage({
  doc,
}: {
  /** Chosen by the caller for the active locale. */
  doc: LegalDoc;
}) {
  const { locale } = useApp();

  const formattedDate = new Date(legal.lastUpdated).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <>
      <PageHero title={doc.title} subtitle={doc.subtitle} />

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <p className="text-sm text-muted-foreground">
                {doc.updatedLabel}: {formattedDate}
              </p>

              {doc.sections.map((section) => (
                <div key={section.heading} className="mt-10">
                  <h2 className="text-xl font-bold text-primary md:text-2xl">
                    {section.heading}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className={
                        // An unfilled legal value is a go-live blocker, so it is
                        // shown as a warning rather than quietly blending in.
                        paragraph.includes(TBD)
                          ? "mt-4 rounded-md bg-destructive/10 px-4 py-3 leading-relaxed text-destructive"
                          : "mt-4 leading-relaxed text-muted-foreground"
                      }
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="mt-4 space-y-2">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          className={
                            item.includes(TBD)
                              ? "flex gap-3 rounded-md bg-destructive/10 px-4 py-2 text-destructive"
                              : "flex gap-3 text-muted-foreground"
                          }
                        >
                          <span aria-hidden="true" className="text-accent">
                            &bull;
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
