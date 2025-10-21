import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-4">
          By accessing this website, you are agreeing to be bound by these
          website Terms and Conditions of Use, all applicable laws and
          regulations, and agree that you are responsible for compliance with
          any applicable local laws.
        </p>
        <h2 className="text-2xl font-bold mb-2">1. Use License</h2>
        <p className="mb-4">
          Permission is granted to temporarily download one copy of the
          materials (information or software) on this website for personal,
          non-commercial transitory viewing only. This is the grant of a
          license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>modify or copy the materials;</li>
          <li>
            use the materials for any commercial purpose, or for any public
            display (commercial or non-commercial);
          </li>
          <li>
            attempt to decompile or reverse engineer any software contained on
            this website;
          </li>
          <li>
            remove any copyright or other proprietary notations from the
            materials; or
          </li>
          <li>
            transfer the materials to another person or "mirror" the materials
            on any other server.
          </li>
        </ul>
        <h2 className="text-2xl font-bold mb-2">2. Disclaimer</h2>
        <p className="mb-4">
          The materials on this website are provided "as is". We make no
          warranties, expressed or implied, and hereby disclaim and negate all
          other warranties, including without limitation, implied warranties or
          conditions of merchantability, fitness for a particular purpose, or
          non-infringement of intellectual property or other violation of
          rights.
        </p>
        <h2 className="text-2xl font-bold mb-2">3. Limitations</h2>
        <p className="mb-4">
          In no event shall we be liable for any damages (including, without
          limitation, damages for loss of data or profit, or due to business
          interruption,) arising out of the use or inability to use the
          materials on our website, even if we or an authorized representative
          has been notified orally or in writing of the possibility of such
damage.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}