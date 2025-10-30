
import React from 'react';

export default function InfoContent({ type }: { type: string }) {
  switch (type) {
    case 'about':
      return (
        <>
          <p><strong>About thecueRoom</strong></p>
          <p>
            thecueRoom is a curated space for underground electronic artists, DJs, and producers.
            Originating from Bangalore's techno subculture, it blends art, technology, and
            community-driven discovery. Our platform celebrates sonic experimentation — connecting
            creators, collectives, and audiences through rhythm, sound, and story.
          </p>
          <p>
            We provide AI-assisted creative tools for press kits, cover art, and EPKs, along with
            real-time gig discovery and community dialogue — inspired by the global warehouse scene.
          </p>
          <p className="italic text-[#9B5CFF]">
            Powered by rhythm, built by the underground.
          </p>
        </>
      );

    case 'privacy':
      return (
        <>
          <p><strong>Privacy Policy</strong></p>
          <p>
            We respect the privacy of our users. thecueRoom collects only essential information —
            such as login credentials and analytics for improving user experience. We do not sell,
            rent, or share your data with any third party.
          </p>
          <p>
            Analytics used on this site are anonymized. User-generated content remains the property
            of the creator. You may request data deletion or account removal by emailing
            {' '}<a href="mailto:support@thecueroom.com" className="text-[#D1FF3D] hover:underline">support@thecueroom.com</a>.
          </p>
          <p>
            Our systems follow GDPR, CCPA, and India's Digital Personal Data Protection Act guidelines.
          </p>
        </>
      );

    case 'terms':
      return (
        <>
          <p><strong>Terms & Conditions</strong></p>
          <p>
            By using thecueRoom, you agree to our code of conduct and content policies.
            Our platform exists to support underground artists — not commercial exploitation.
            Users must not upload copyrighted or harmful material.
          </p>
          <p>
            thecueRoom provides access "as-is" without any warranty. We reserve the right to remove
            content that violates community ethics or legal standards.
          </p>
          <p>
            All interactions, uploads, and shared data are subject to moderation under our guidelines.
          </p>
        </>
      );

    case 'contact':
      return (
        <>
          <p><strong>Contact Us</strong></p>
          <p>For general inquiries or collaborations, reach out to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>General / Support: <a href="mailto:support@thecueroom.com" className="text-[#D1FF3D] hover:underline">support@thecueroom.com</a></li>
            <li>Press & Partnerships: <a href="mailto:press@thecueroom.com" className="text-[#D1FF3D] hover:underline">press@thecueroom.com</a></li>
            <li>Booking / Gigs: <a href="mailto:gigs@thecueroom.com" className="text-[#D1FF3D] hover:underline">gigs@thecueroom.com</a></li>
          </ul>
          <p className="pt-2">Headquarters: Bangalore, India — connected to the global underground.</p>
          <p className="italic text-[#9B5CFF]">
            Sound unites. Technology amplifies. thecueRoom connects.
          </p>
        </>
      );

    default:
      return <p>Content unavailable.</p>;
  }
}
