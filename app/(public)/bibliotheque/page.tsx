import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  CircleHelp,
  FileQuestion,
  GraduationCap,
  Image as ImageIcon,
  Landmark,
  Lock,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "Bibliothèque documentaire",
  description: "Questionnaires, notions de mathématiques, informations générales et communiqués, avec statut de vérification.",
};

const documentTypes = [
  { icon: FileQuestion, title: "Questionnaires psychotechniques", text: "Séries d'exercices d'entraînement à imprimer ou consulter." },
  { icon: GraduationCap, title: "Notions fondamentales de mathématiques", text: "Fiches de rappel : pourcentages, fractions, proportionnalité, suites." },
  { icon: BookOpen, title: "Ressources de préparation", text: "Fiches méthode, conseils de gestion du temps et du stress." },
  { icon: Megaphone, title: "Communiqués de recrutement", text: "Avis publics relayés avec leur source, pour suivre le calendrier." },
  { icon: Landmark, title: "Informations générales sur la BCC", text: "Repères institutionnels utiles à la culture générale du candidat." },
  { icon: Building2, title: "Documents institutionnels", text: "Textes de référence publics, avec leur provenance." },
  { icon: ImageIcon, title: "Images et captures", text: "Illustrations et exemples de mise en forme." },
];

const statuses = [
  {
    icon: BadgeCheck,
    label: "Officiel vérifié",
    className: "bg-success-muted text-success",
    text: "Document dont la provenance officielle a été vérifiée, par exemple sur le site de l'émetteur.",
  },
  {
    icon: CircleHelp,
    label: "Non vérifié",
    className: "bg-warning/15 text-warning-foreground",
    text: "Document reçu dont l'origine n'a pas pu être confirmée. Il ne doit pas être considéré comme officiel.",
  },
  {
    icon: Sparkles,
    label: "Contenu de la plateforme",
    className: "bg-accent text-accent-foreground",
    text: "Ressource pédagogique conçue par l'équipe de la plateforme.",
  },
];

export default function BibliothequePage() {
  return (
    <>
      <PageHero
        eyebrow="Bibliothèque documentaire"
        title="Des ressources fiables, à la source identifiée"
        description="La bibliothèque rassemble des documents de préparation et d'information. Chaque document affiche sa catégorie, sa date, sa source et son statut de vérification."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="xl" variant="sky">
            <Link href="/connexion">
              <Lock data-icon="inline-start" /> Accéder aux documents
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-white/60">La consultation des documents est réservée aux membres connectés.</p>
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Types de documents" title="Ce que vous trouverez dans la bibliothèque" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {documentTypes.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-heading font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="bg-secondary/50">
        <SectionHeading
          eyebrow="Statut de vérification"
          title="Vous savez toujours d'où vient un document"
          description="Un document non vérifié n'est jamais présenté comme un communiqué officiel. Pour toute information officielle, référez-vous au site de l'organisme émetteur."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {statuses.map(({ icon: Icon, label, className, text }) => (
            <li key={label} className="rounded-2xl border bg-card p-6">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
                <Icon className="size-4" aria-hidden /> {label}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title="Créez votre compte pour consulter la bibliothèque"
        description="L'accès est gratuit. Les documents sont servis par des liens sécurisés et temporaires."
      />
    </>
  );
}
