import { Html, Head, Main, NextScript } from "next/document";

/*
  The camera is an enhancement: without JS the sheet is a plain reading column. With JS the
  camera is always on; reduced motion adds `calm`, which keeps the travel and drops the 3D
  tilt, the peel and the pull-back. Runs before first paint so nothing flashes in late.
*/
const CAM = `try{var c=document.documentElement.classList;c.add('cam');if(matchMedia('(prefers-reduced-motion: reduce)').matches)c.add('calm')}catch(e){}`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: CAM }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
