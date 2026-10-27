import type { Locale } from "@/lib/translations";
import { company, legal, getContactEmail, getCareerEmail } from "@/lib/site";

/* ─────────────────────────────────────────────────────────────────────────────
 * Imprint and privacy copy, both languages.
 *
 * Kept out of lib/translations.ts on purpose: that file is marketing copy that
 * anyone may reword freely, while this is legal text where the wording is the
 * point. Changing it should be a deliberate act, reviewed by whoever advises
 * the company — not a drive-by edit while fixing a headline.
 *
 * ── Read this before going live ──────────────────────────────────────────────
 * These are complete, honest templates describing what this site actually does
 * (see the notes under each section), but they are not legal advice and have
 * not been reviewed by a lawyer. Two things are required before launch:
 *
 *   1. Fill in every TBD in `legal` in src/lib/site.ts.
 *   2. Have the result checked by whoever advises Flink Freight on German
 *      commercial law — especially the retention periods, which depend on how
 *      the company actually works.
 *
 * The German text is the operative one for a German company; the English
 * version is a courtesy translation for the .eu audience.
 * ───────────────────────────────────────────────────────────────────────── */

export interface LegalSection {
  heading: string;
  /** Rendered as paragraphs, in order. */
  paragraphs?: string[];
  /** Rendered as a bulleted list under the paragraphs. */
  list?: string[];
}

export interface LegalDoc {
  title: string;
  subtitle: string;
  updatedLabel: string;
  sections: LegalSection[];
}

const addressLine = `${company.address.line1}, ${company.address.line2}`;

// ─────────────────────────────────────────────────────────────────────────────
// Imprint (§5 DDG, §18 Abs. 2 MStV)
// ─────────────────────────────────────────────────────────────────────────────

function imprintDe(): LegalDoc {
  const email = getContactEmail("de");
  return {
    title: "Impressum",
    subtitle: "Angaben gemäß § 5 DDG",
    updatedLabel: "Stand",
    sections: [
      {
        heading: "Diensteanbieter",
        paragraphs: [legal.registeredName, addressLine],
      },
      {
        heading: "Vertreten durch",
        list: legal.representatives,
      },
      {
        heading: "Kontakt",
        list: [`E-Mail: ${email}`, `Bewerbungen: ${getCareerEmail("de")}`],
        paragraphs: [
          "Anfragen erreichen uns am schnellsten über das Kontaktformular auf dieser Website oder per E-Mail. Wir antworten in der Regel innerhalb eines Werktages.",
        ],
      },
      {
        heading: "Registereintrag",
        list: [
          `Registergericht: ${legal.registerCourt}`,
          `Registernummer: ${legal.registerNumber}`,
        ],
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        paragraphs: [
          `Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${legal.vatId}`,
        ],
      },
      {
        heading: "Redaktionell verantwortlich",
        paragraphs: [
          `Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: ${legal.contentResponsible}, ${addressLine}`,
        ],
      },
      {
        heading: "Verbraucherstreitbeilegung",
        paragraphs: [
          "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).",
          "Die von der Europäischen Kommission betriebene Plattform zur Online-Streitbeilegung (OS-Plattform) wurde zum 20. Juli 2025 eingestellt; ein Verweis darauf entfällt daher.",
        ],
      },
      {
        heading: "Haftung für Inhalte",
        paragraphs: [
          "Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
          "Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir diese Inhalte umgehend.",
        ],
      },
      {
        heading: "Haftung für Links",
        paragraphs: [
          "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.",
          "Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.",
        ],
      },
      {
        heading: "Urheberrecht",
        paragraphs: [
          "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.",
        ],
      },
    ],
  };
}

function imprintEn(): LegalDoc {
  const email = getContactEmail("en");
  return {
    title: "Legal Notice",
    subtitle: "Information pursuant to § 5 DDG (German Digital Services Act)",
    updatedLabel: "Last reviewed",
    sections: [
      {
        heading: "Service provider",
        paragraphs: [legal.registeredName, addressLine],
      },
      {
        heading: "Represented by",
        list: legal.representatives,
      },
      {
        heading: "Contact",
        list: [`Email: ${email}`, `Job applications: ${getCareerEmail("en")}`],
        paragraphs: [
          "The fastest way to reach us is the contact form on this website or email. We normally reply within one working day.",
        ],
      },
      {
        heading: "Commercial register",
        list: [
          `Register court: ${legal.registerCourt}`,
          `Register number: ${legal.registerNumber}`,
        ],
      },
      {
        heading: "VAT identification number",
        paragraphs: [
          `VAT identification number pursuant to § 27a of the German VAT Act: ${legal.vatId}`,
        ],
      },
      {
        heading: "Responsible for editorial content",
        paragraphs: [
          `Responsible for content pursuant to § 18 (2) MStV: ${legal.contentResponsible}, ${addressLine}`,
        ],
      },
      {
        heading: "Consumer dispute resolution",
        paragraphs: [
          "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board (§ 36 VSBG).",
          "The European Commission's Online Dispute Resolution platform was discontinued on 20 July 2025, so no reference to it is given.",
        ],
      },
      {
        heading: "Liability for content",
        paragraphs: [
          "As a service provider we are responsible for our own content on these pages under general law. We are not obliged, however, to monitor transmitted or stored third-party information, or to investigate circumstances that indicate unlawful activity.",
          "Obligations to remove or block the use of information under general law remain unaffected. Liability in this respect is only possible from the point at which we become aware of a specific infringement. We will remove such content promptly once we learn of it.",
        ],
      },
      {
        heading: "Liability for links",
        paragraphs: [
          "Our site contains links to external third-party websites over whose content we have no control. We therefore cannot accept any responsibility for that third-party content. The respective provider or operator of the linked pages is always responsible for their content.",
          "The linked pages were checked for possible legal violations at the time of linking, and no unlawful content was apparent. We will remove such links promptly if we become aware of any infringement.",
        ],
      },
      {
        heading: "Copyright",
        paragraphs: [
          "The content and works created by the site operators on these pages are subject to German copyright law. Reproduction, adaptation, distribution and any kind of exploitation beyond the limits of copyright require the written consent of the respective author or creator.",
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Privacy policy (Art. 13 GDPR)
//
// The content below describes what this site genuinely does, which is unusually
// little: no cookies beyond two preference keys, no analytics, no tracking, no
// third-party fonts or maps loaded from anyone else's server. If that ever
// changes — an analytics script, a Google Maps embed, a chat widget — this file
// has to change with it, and a consent banner becomes necessary.
// ─────────────────────────────────────────────────────────────────────────────

function privacyDe(): LegalDoc {
  const email = getContactEmail("de");
  return {
    title: "Datenschutzerklärung",
    subtitle: "Informationen zur Verarbeitung Ihrer Daten nach Art. 13 DSGVO",
    updatedLabel: "Stand",
    sections: [
      {
        heading: "1. Verantwortlicher",
        paragraphs: [
          "Verantwortlich für die Datenverarbeitung auf dieser Website ist:",
          `${legal.registeredName}, ${addressLine}`,
          `E-Mail: ${email}`,
          `Vertreten durch: ${legal.representatives.join(", ")}`,
        ],
      },
      {
        heading: "2. Überblick",
        paragraphs: [
          "Diese Website ist bewusst datensparsam aufgebaut. Wir setzen keine Analyse- oder Tracking-Dienste ein, binden keine Werbenetzwerke ein und laden keine Schriftarten, Karten oder Videos von fremden Servern nach. Es gibt daher keinen Cookie-Banner, weil es nichts gibt, wozu Sie einwilligen müssten.",
          "Personenbezogene Daten verarbeiten wir nur, wenn Sie uns aktiv welche übermitteln — über das Kontaktformular oder das Bewerbungsformular — sowie in Form technischer Server-Protokolle, die beim Abruf jeder Website anfallen.",
        ],
      },
      {
        heading: "3. Aufruf der Website (Server-Logfiles)",
        paragraphs: [
          "Beim Aufruf dieser Website übermittelt Ihr Browser automatisch technische Daten, die unser Hoster in Server-Logfiles speichert. Erfasst werden:",
        ],
        list: [
          "IP-Adresse des anfragenden Geräts",
          "Datum und Uhrzeit des Zugriffs",
          "Name und URL der abgerufenen Datei",
          "übertragene Datenmenge und Meldung über den Abrufstatus",
          "verwendeter Browser, Betriebssystem und ggf. die verweisende Seite",
        ],
      },
      {
        heading: "3.1 Rechtsgrundlage und Zweck der Logfiles",
        paragraphs: [
          "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und störungsfreien Betrieb der Website sowie in der Abwehr von Angriffen. Eine Zusammenführung dieser Daten mit anderen Datenquellen findet nicht statt, und es erfolgt keine Auswertung zu Werbezwecken.",
          "Die Logfiles werden nach spätestens sieben Tagen gelöscht, sofern sie nicht zur Aufklärung eines konkreten Sicherheitsvorfalls länger benötigt werden.",
        ],
      },
      {
        heading: "4. Hosting",
        paragraphs: [
          "Diese Website wird bei einem Anbieter in Deutschland gehostet. Der Hoster verarbeitet die oben genannten Logfiles ausschließlich in unserem Auftrag und nach unseren Weisungen. Mit ihm besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.",
        ],
      },
      {
        heading: "5. Kontaktformular",
        paragraphs: [
          "Wenn Sie uns über das Kontaktformular eine Anfrage senden, verarbeiten wir die von Ihnen eingegebenen Daten: Name, E-Mail-Adresse, optional Telefonnummer und Betreff, Ihre Nachricht sowie — falls angegeben — Maße und Gewicht der Sendung und ein hochgeladenes Foto der Ware.",
          "Zweck der Verarbeitung ist ausschließlich die Bearbeitung Ihrer Anfrage und die Erstellung eines Angebots. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage auf den Abschluss eines Vertrages gerichtet ist, im Übrigen Art. 6 Abs. 1 lit. f DSGVO aufgrund unseres berechtigten Interesses an der Beantwortung von Anfragen.",
          "Die Angabe von Name, E-Mail-Adresse und Nachricht ist erforderlich, um Ihre Anfrage bearbeiten zu können. Alle übrigen Angaben sind freiwillig.",
        ],
      },
      {
        heading: "6. Bewerbungen",
        paragraphs: [
          "Über das Karriereformular verarbeiten wir die von Ihnen übermittelten Bewerbungsdaten: Name, E-Mail-Adresse, optional Telefonnummer und gewünschte Position, Ihr Anschreiben sowie Ihren Lebenslauf.",
          "Rechtsgrundlage ist § 26 Abs. 1 BDSG in Verbindung mit Art. 6 Abs. 1 lit. b DSGVO — die Verarbeitung dient der Entscheidung über die Begründung eines Beschäftigungsverhältnisses.",
          "Kommt es nicht zu einer Einstellung, löschen wir Ihre Bewerbungsunterlagen sechs Monate nach Abschluss des Verfahrens. Diese Frist ergibt sich aus der zweimonatigen Klagefrist des § 15 Abs. 4 AGG zuzüglich eines Sicherheitszuschlags. Möchten Sie, dass wir Ihre Unterlagen für künftige Stellen länger aufbewahren, teilen Sie uns das bitte mit; wir holen dann Ihre gesonderte Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO ein.",
        ],
      },
      {
        heading: "7. Empfänger und Auftragsverarbeiter",
        paragraphs: [
          "Formulareingaben werden per E-Mail an unsere Postfächer zugestellt; hochgeladene Dateien (Lebensläufe, Fotos) werden in unserem Microsoft-365-Speicher abgelegt. Beides erbringt die Microsoft Ireland Operations Limited als Auftragsverarbeiter für uns, auf Grundlage eines Vertrags nach Art. 28 DSGVO.",
          "Microsoft kann dabei Daten auch außerhalb der EU verarbeiten. Für solche Übermittlungen bestehen die Standardvertragsklauseln der Europäischen Kommission sowie die ergänzenden Zusagen des Microsoft Data Protection Addendum als Garantien nach Art. 46 DSGVO.",
          "Darüber hinaus geben wir Ihre Daten nicht an Dritte weiter, außer wir sind gesetzlich dazu verpflichtet.",
        ],
      },
      {
        heading: "8. Speicherdauer",
        paragraphs: [
          "Anfragen aus dem Kontaktformular bewahren wir so lange auf, wie es zur Bearbeitung erforderlich ist. Führt die Anfrage zu einem Vertrag, gelten die handels- und steuerrechtlichen Aufbewahrungsfristen von sechs bzw. zehn Jahren (§ 257 HGB, § 147 AO). Führt sie zu keinem Vertrag, löschen wir die Anfrage spätestens zwei Jahre nach dem letzten Kontakt.",
          "Für Bewerbungsunterlagen gilt die unter Ziffer 6 genannte Frist.",
        ],
      },
      {
        heading: "9. Lokale Speicherung im Browser",
        paragraphs: [
          "Diese Website speichert zwei Einstellungen lokal in Ihrem Browser (Local Storage): die gewählte Sprache und das gewählte Farbschema (hell oder dunkel). Diese Angaben verlassen Ihr Gerät nicht, werden nicht an uns übertragen und erlauben keinen Rückschluss auf Ihre Person.",
          "Da sie ausschließlich dazu dienen, den von Ihnen ausdrücklich gewünschten Dienst bereitzustellen, ist dafür nach § 25 Abs. 2 Nr. 2 TDDDG keine Einwilligung erforderlich. Sie können sie jederzeit über die Einstellungen Ihres Browsers löschen.",
        ],
      },
      {
        heading: "10. Schriftarten und Karten",
        paragraphs: [
          "Die verwendeten Schriftarten werden bei der Erstellung der Website heruntergeladen und von unserem eigenen Server ausgeliefert. Es besteht dadurch keine Verbindung zu Google Fonts, und Ihre IP-Adresse wird nicht an Google übermittelt.",
          "Die Weltkarte auf der Kontaktseite wird ebenfalls vollständig von unserem Server geladen. Es wird kein Kartendienst eines Dritten eingebunden.",
        ],
      },
      {
        heading: "11. Verschlüsselung",
        paragraphs: [
          "Diese Website nutzt durchgehend eine TLS-Verschlüsselung. Sie erkennen das an dem Schloss-Symbol in der Adresszeile Ihres Browsers und an der Adresse, die mit „https://“ beginnt. Inhalte, die Sie uns über die Formulare senden, können dadurch nicht von Dritten mitgelesen werden.",
        ],
      },
      {
        heading: "12. Ihre Rechte",
        paragraphs: ["Ihnen stehen gegenüber uns die folgenden Rechte zu:"],
        list: [
          "Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)",
          "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
          "Löschung Ihrer Daten (Art. 17 DSGVO)",
          "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
          "Datenübertragbarkeit (Art. 20 DSGVO)",
          "Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO)",
          "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
        ],
      },
      {
        heading: "13. Beschwerderecht bei der Aufsichtsbehörde",
        paragraphs: [
          "Unabhängig davon steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsortes, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Für uns zuständig ist:",
          `${legal.supervisoryAuthority.name}, ${legal.supervisoryAuthority.address}`,
          legal.supervisoryAuthority.url,
        ],
      },
      {
        heading: "14. Änderungen dieser Erklärung",
        paragraphs: [
          "Wir passen diese Datenschutzerklärung an, sobald sich die Verarbeitung ändert — etwa weil eine neue Funktion hinzukommt. Es gilt jeweils die hier veröffentlichte Fassung mit dem oben genannten Stand.",
        ],
      },
    ],
  };
}

function privacyEn(): LegalDoc {
  const email = getContactEmail("en");
  return {
    title: "Privacy Policy",
    subtitle: "How we handle your data, pursuant to Art. 13 GDPR",
    updatedLabel: "Last reviewed",
    sections: [
      {
        heading: "1. Controller",
        paragraphs: [
          "The controller for data processing on this website is:",
          `${legal.registeredName}, ${addressLine}`,
          `Email: ${email}`,
          `Represented by: ${legal.representatives.join(", ")}`,
        ],
      },
      {
        heading: "2. Overview",
        paragraphs: [
          "This website is deliberately data-minimal. We use no analytics or tracking services, embed no advertising networks, and load no fonts, maps or videos from anyone else's servers. There is therefore no cookie banner, because there is nothing for you to consent to.",
          "We process personal data only where you actively send it to us — through the contact form or the job application form — and in the form of technical server logs, which arise whenever any website is requested.",
        ],
      },
      {
        heading: "3. Visiting the website (server log files)",
        paragraphs: [
          "When you open this website your browser automatically transmits technical data, which our hosting provider stores in server log files. These record:",
        ],
        list: [
          "the IP address of the requesting device",
          "the date and time of the request",
          "the name and URL of the file requested",
          "the volume of data transferred and the status of the request",
          "the browser and operating system used, and the referring page where applicable",
        ],
      },
      {
        heading: "3.1 Legal basis and purpose of the log files",
        paragraphs: [
          "The legal basis is Art. 6 (1) (f) GDPR. Our legitimate interest lies in the secure, uninterrupted operation of the website and in defending against attacks. This data is not combined with other sources and is not evaluated for advertising purposes.",
          "Log files are deleted after seven days at the latest, unless they are needed longer to investigate a specific security incident.",
        ],
      },
      {
        heading: "4. Hosting",
        paragraphs: [
          "This website is hosted with a provider in Germany. The host processes the log files described above solely on our behalf and on our instructions, under a data processing agreement pursuant to Art. 28 GDPR.",
        ],
      },
      {
        heading: "5. Contact form",
        paragraphs: [
          "When you send us an enquiry through the contact form we process the data you enter: name, email address, optionally telephone number and subject, your message, and — where supplied — the dimensions and weight of the shipment and an uploaded photo of the goods.",
          "The purpose is solely to handle your enquiry and prepare a quotation. The legal basis is Art. 6 (1) (b) GDPR where your enquiry is directed at concluding a contract, and otherwise Art. 6 (1) (f) GDPR based on our legitimate interest in answering enquiries.",
          "Name, email address and message are required in order to handle your enquiry. All other fields are optional.",
        ],
      },
      {
        heading: "6. Job applications",
        paragraphs: [
          "Through the careers form we process the application data you submit: name, email address, optionally telephone number and the position applied for, your covering letter, and your CV.",
          "The legal basis is § 26 (1) of the German Federal Data Protection Act in conjunction with Art. 6 (1) (b) GDPR — the processing serves the decision on entering into an employment relationship.",
          "If no appointment is made, we delete your application documents six months after the process concludes. That period follows from the two-month limitation period in § 15 (4) of the German General Equal Treatment Act plus a safety margin. If you would like us to keep your documents longer for future openings, please tell us; we will then obtain your separate consent under Art. 6 (1) (a) GDPR.",
        ],
      },
      {
        heading: "7. Recipients and processors",
        paragraphs: [
          "Form submissions are delivered by email to our mailboxes, and uploaded files (CVs, photos) are stored in our Microsoft 365 storage. Both services are provided to us by Microsoft Ireland Operations Limited as a processor, under an agreement pursuant to Art. 28 GDPR.",
          "Microsoft may process data outside the EU in doing so. Such transfers are covered by the European Commission's Standard Contractual Clauses together with the additional commitments in the Microsoft Data Protection Addendum, as safeguards under Art. 46 GDPR.",
          "Beyond this we do not pass your data to third parties unless we are legally obliged to.",
        ],
      },
      {
        heading: "8. Retention",
        paragraphs: [
          "We keep contact form enquiries for as long as handling them requires. Where an enquiry leads to a contract, the commercial and tax retention periods of six and ten years respectively apply (§ 257 HGB, § 147 AO). Where it does not, we delete the enquiry no later than two years after the last contact.",
          "For application documents, the period stated in section 6 applies.",
        ],
      },
      {
        heading: "9. Local storage in your browser",
        paragraphs: [
          "This website stores two settings locally in your browser (local storage): your chosen language and your chosen colour scheme (light or dark). This information never leaves your device, is not transmitted to us, and does not allow you to be identified.",
          "Because it serves solely to provide the service you have expressly requested, no consent is required for it under § 25 (2) no. 2 TDDDG. You can delete it at any time through your browser settings.",
        ],
      },
      {
        heading: "10. Fonts and maps",
        paragraphs: [
          "The fonts used are downloaded when the website is built and served from our own server. No connection to Google Fonts is made and your IP address is not transmitted to Google.",
          "The world map on the contact page is likewise loaded entirely from our own server. No third-party mapping service is embedded.",
        ],
      },
      {
        heading: "11. Encryption",
        paragraphs: [
          "This website uses TLS encryption throughout. You can recognise it by the padlock symbol in your browser's address bar and by the address beginning with “https://”. Content you send us through the forms therefore cannot be read by third parties in transit.",
        ],
      },
      {
        heading: "12. Your rights",
        paragraphs: ["You have the following rights in relation to us:"],
        list: [
          "access to the data we hold about you (Art. 15 GDPR)",
          "rectification of inaccurate data (Art. 16 GDPR)",
          "erasure of your data (Art. 17 GDPR)",
          "restriction of processing (Art. 18 GDPR)",
          "data portability (Art. 20 GDPR)",
          "objection to processing based on Art. 6 (1) (f) GDPR (Art. 21 GDPR)",
          "withdrawal of consent with effect for the future (Art. 7 (3) GDPR)",
        ],
      },
      {
        heading: "13. Right to lodge a complaint",
        paragraphs: [
          "You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the member state of your residence, your place of work, or the place of the alleged infringement. The authority responsible for us is:",
          `${legal.supervisoryAuthority.name}, ${legal.supervisoryAuthority.address}`,
          legal.supervisoryAuthority.url,
        ],
      },
      {
        heading: "14. Changes to this policy",
        paragraphs: [
          "We update this privacy policy whenever our processing changes — for example because a new feature is added. The version published here, bearing the date above, is the one that applies.",
        ],
      },
    ],
  };
}

/**
 * Built on each call rather than held as a constant so the texts always reflect
 * the current values in `legal` — including, in development, an edit made to
 * src/lib/site.ts without a restart.
 */
export function getImprint(locale: Locale): LegalDoc {
  return locale === "de" ? imprintDe() : imprintEn();
}

export function getPrivacyPolicy(locale: Locale): LegalDoc {
  return locale === "de" ? privacyDe() : privacyEn();
}
