import { Link } from "@remix-run/react";
import PublicNavbar from "~/components/PublicNavbar";
import PublicFooter from "~/components/PublicFooter";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy - BlogStack" },
    {
      name: "description",
      content:
        "Learn about how BlogStack collects, uses, and protects your personal information. Our commitment to your privacy and data security.",
    },
    {
      property: "og:title",
      content: "Privacy Policy - BlogStack",
    },
    {
      property: "og:description",
      content:
        "Learn about how BlogStack collects, uses, and protects your personal information. Our commitment to your privacy and data security.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "Privacy Policy - BlogStack",
    },
    {
      name: "twitter:description",
      content:
        "Learn about how BlogStack collects, uses, and protects your personal information. Our commitment to your privacy and data security.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <PublicNavbar />

      <div className="flex-grow">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Last updated: 12:21 AM March 26, 2025
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2>Description</h2>
            <p>
              This Privacy Policy describes Our policies and procedures on the
              collection, use and disclosure of Your information when You use
              the Service and tells You about Your privacy rights and how the
              law protects You. We use Your Personal data to provide and improve
              the Service. By using the Service, You agree to the collection and
              use of information in accordance with this Privacy Policy.
            </p>

            <h2>Interpretation</h2>
            <p>
              The words of which the initial letter is capitalized have meanings
              defined under the following conditions. The following definitions
              shall have the same meaning regardless of whether they appear in
              singular or in plural.
            </p>
            <h2>Definitions </h2>
            <p>
              For the purposes of this Privacy Policy:
              <br />
              * Account means a unique account created for You to access our
              Service or parts of our Service.
              <br />
              * Affiliate means an entity that controls, is controlled by or is
              under common control with a party, where "control" means ownership
              of 50% or more of the shares, equity interest or other securities
              entitled to vote for election of directors or other managing
              authority.
              <br />
              * Company (referred to as either "the Company", "We", "Us" or
              "Our" in this Agreement) refers to BlogStack.
              <br />
              * Cookies are small files that are placed on Your computer, mobile
              device or any other device by a website, containing the details of
              Your browsing history on that website among its many uses.
              <br />
              * Country refers to: Karnataka, India
              <br />
              * Device means any device that can access the Service such as a
              computer, a cellphone or a digital tablet.
              <br />
              * Personal Data is any information that relates to an identified
              or identifiable individual.
              <br />
              * Service refers to the Website.
              <br />
              * Service Provider means any natural or legal person who processes
              the data on behalf of the Company. It refers to third-party
              companies or individuals employed by the Company to facilitate the
              Service, to provide the Service on behalf of the Company, to
              perform services related to the Service or to assist the Company
              in analyzing how the Service is used.
              <br />
              * Third-party Social Media Service refers to any website or any
              social network website through which a User can log in or create
              an account to use the Service.
              <br />
              * Usage Data refers to data collected automatically, either
              generated by the use of the Service or from the Service
              infrastructure itself (for example, the duration of a page visit).
              <br />
              * Website refers to BlogStack, accessible from [
              https://blogstack.site](https://blogstack.site)
              <br />* You means the individual accessing or using the Service,
              or the company, or other legal entity on behalf of which such
              individual is accessing or using the Service, as applicable.
            </p>

            <h2>Collecting and Using Your Personal Data</h2>
            <h3>Types of Data Collected </h3>
            <h4>Personal Data </h4>
            <p>
              While using Our Service, We may ask You to provide Us with certain
              personally identifiable information that can be used to contact or
              identify You. Personally identifiable information may include, but
              is not limited to:
              <br />
              * Email address
              <br />
              * First name and last name
              <br />
              * Phone number
              <br />* Usage Data
            </p>
            <h4>Usage Data</h4>
            <p>
              Usage Data is collected automatically when using the Service.
              Usage Data may include information such as Your Device's Internet
              Protocol address (e.g. IP address), browser type, browser version,
              the pages of our Service that You visit, the time and date of Your
              visit, the time spent on those pages, unique device identifiers
              and other diagnostic data. When You access the Service by or
              through a mobile device, We may collect certain information
              automatically, including, but not limited to, the type of mobile
              device You use, Your mobile device unique ID, the IP address of
              Your mobile device, Your mobile operating system, the type of
              mobile Internet browser You use, unique device identifiers and
              other diagnostic data. We may also collect information that Your
              browser sends whenever You visit our Service or when You access
              the Service by or through a mobile device.
            </p>
            <h4>Information from Third-Party Social Media Services</h4>
            <p>
              The Company allows You to create an account and log in to use the
              Service through the following Third-party Social Media Services:
              <br />
              * Google
              <br />* GitHub name, Your email address, Your activities or Your
              contact list associated with that account.
            </p>
            <p>
              You may also have the option of sharing additional information
              with the Company through Your Third-Party Social Media Service's
              account. If You choose to provide such information and Personal
              Data, during registration or otherwise, You are giving the Company
              permission to use, share, and store it in a manner consistent with
              this Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
