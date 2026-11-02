import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  FileQuestion,
  GraduationCap,
  Image as ImageIcon,
  Landmark,
  Lock,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { IconTile } from "@/components/shared/icon-tile";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "Bibliothèque documentaire",
  description: "Questionnaires, notions de mathématiques, informations générales et communiqués, avec statut de vérification.",
};

const documentTypes = [
  { icon: FileQuestion, title: "Questionnaires psychotechniques", text: "Séries d'exercices d'entraînement à consulter ou imprimer." },
  { icon: GraduationCap, title: "Notions de mathématiques", text: "Rappels : pourcentages, fractions, proportionnalité, suites." },
  { icon: BookOpen, title: "Ressources de préparation", text: "Fiches méthode, gestion du temps et du stress." },
  { icon: Megaphone, title: "Communiqués de recrutement", text: "Avis publics relayés avec leur source." },
  { icon: Landmark, title: "Informations sur la BCC", text: "Repères institutionnels utiles à la culture générale." },
  { icon: Building2, title: "Documents institutionnels", text: "Textes de référence publics, avec leur provenance." },
  { icon: ImageIcon, title: "Images et captures", text: "Illustrations et exemples de mise en forme." },
];

const statuses = [
  {
    label: "Officiel vérifié",
    dot: "bg-success",
    text: "La provenance officielle du document a été vérifiée, par exemple sur le site de l'émetteur.",
  },
  {
    label: "Non vérifié",
    dot: "bg-warning",
    text: "L'origine du document n'a pas pu être confirmée. Il ne doit pas être considéré comme officiel.",
  },
  {
    label: "Contenu de la plateforme",
    dot: "bg-brand-sky",
    text: "Ressource pédagogique conçue par l'équipe de la plateforme.",
  },
];

export default function BibliothequePage() {
  return (
    <>
      <PageHero
        eyebrow="Bibliothèque"
        title="Des ressources fiables, à la source identifiée"
        description="Chaque document affiche sa catégorie, sa date, sa source et son statut de vérification."
      >
        <div className="mt-9 flex flex-col items-center gap-3">
          <Button asChild size="xl" variant="sky">
            <Link href="/connexion">
              <Lock data-icon="inline-start" /> Accéder aux documents
            </Link>
          </Button>
          <p className="text-sm text-white/50">Réservé aux membres connectés. L&apos;inscription est gratuite.</p>
        </div>
      </PageHero>

      <Section>
        <SectionHeading title="Ce que contient la bibliothèque" />
        <ul className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {documentTypes.map(({ icon, title, text }) => (
            <li key={title}>
              <IconTile icon={icon} />
              <h3 className="mt-4 font-heading font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-t bg-secondary/50">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            title="Vous savez toujours d'où vient un document"
            description="Un document non vérifié n'est jamais présenté comme un communiqué officiel. Pour toute information officielle, référez-vous au site de l'organisme émetteur."
          />
          <dl className="divide-y border-y">
            {statuses.map((status) => (
              <div key={status.label} className="py-5">
                <dt className="flex items-center gap-2.5 font-medium">
                  <span className={`size-2 rounded-full ${status.dot}`} aria-hidden />
                  {status.label}
                </dt>
                <dd className="mt-1.5 pl-[1.15rem] text-[0.95rem] leading-relaxed text-muted-foreground">
                  {status.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <CtaBand
        title="Créez votre compte pour consulter la bibliothèque"
        description="L'accès est gratuit. Les documents sont servis par des liens sécurisés et temporaires."
      />
    </>
  );
}
