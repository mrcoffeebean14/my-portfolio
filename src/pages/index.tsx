import Head from "next/head";
import { Sheet } from "@/components/Sheet";
import { profile } from "@/data/profile";

/* Plan, brief and verification: scrollcraft/builds/portfolio/ */

export default function HomePage() {
  const title = `${profile.name}, ${profile.role}`;
  const description =
    "Backend and agentic AI engineer. Retrieval graphs, agents and the APIs under them, shipped. Final-year computer science, New Delhi.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0c0d0a" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Sheet />
    </>
  );
}
