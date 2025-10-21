import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          Your privacy is important to us. It is our policy to respect your
          privacy regarding any information we may collect from you across our
          website.
        </p>
        <h2 className="text-2xl font-bold mb-2">1. Information we collect</h2>
        <p className="mb-4">
          We only collect information about you if we have a reason to do so -
          for example, to provide our Services, to communicate with you, or to
          make our Services better.
        </p>
        <h2 className="text-2xl font-bold mb-2">2. How we use information</h2>
        <p className="mb-4">
          We use the information we collect in various ways, including to:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>
            Communicate with you, either directly or through one of our
            partners, including for customer service, to provide you with
            updates and other information relating to the website, and for
            marketing and promotional purposes
          </li>
          <li>Send you emails</li>
          <li>Find and prevent fraud</li>
        </ul>
        <h2 className="text-2xl font-bold mb-2">3. Log Files</h2>
        <p className="mb-4">
          Like many other websites, we use log files. These files log visitors
          when they visit websites. The information collected by log files
          include internet protocol (IP) addresses, browser type, Internet
          Service Provider (ISP), date and time stamp, referring/exit pages,
          and possibly the number of clicks. These are not linked to any

          information that is personally identifiable. The purpose of the
          information is for analyzing trends, administering the site,
          tracking users movement on the website, and gathering demographic
          information.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}