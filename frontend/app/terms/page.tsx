import Link from 'next/link'

export default function TermsPage() {
  const lastUpdated = 'March 2025'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a1a2e] py-12 text-center">
        <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
          📄 Legal
        </span>
        <h1 className="text-3xl font-black text-white mb-2">Terms & Conditions</h1>
        <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8">

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Please read these Terms and Conditions carefully before using BELLMAK. By accessing or using our platform,
              you agree to be bound by these terms. If you do not agree, please do not use BELLMAK.
            </p>
          </div>

          {[
            {
              title: '1. Acceptance of Terms',
              content: [
                'By creating an account or using BELLMAK, you confirm that you are at least 18 years old and legally capable of entering into binding contracts.',
                'You agree to these Terms, our Privacy Policy, and any other policies we publish.',
                'We reserve the right to update these Terms at any time. Continued use of the platform means you accept the updated terms.',
              ]
            },
            {
              title: '2. User Accounts',
              content: [
                'You must provide accurate, current, and complete information when creating an account.',
                'You are responsible for maintaining the security of your account and password.',
                'You must notify us immediately if you suspect unauthorized access to your account.',
                'You may not share your account credentials with others or create accounts for fraudulent purposes.',
                'We reserve the right to suspend or terminate accounts that violate these Terms.',
              ]
            },
            {
              title: '3. Buying on BELLMAK',
              content: [
                'When you place an order, you enter into a contract with the seller, not with BELLMAK.',
                'BELLMAK acts as a facilitator / marketplace platform between buyers and sellers.',
                'Prices displayed are inclusive of applicable taxes unless stated otherwise.',
                'We reserve the right to cancel orders if we detect fraud, pricing errors, or stock unavailability.',
                'By completing a purchase, you agree to our Cancellation, Return, and Refund Policy.',
              ]
            },
            {
              title: '4. Selling on BELLMAK',
              content: [
                'Sellers must complete KYC verification before listing products.',
                'Sellers are responsible for the accuracy of product descriptions, images, and pricing.',
                'Sellers must not list counterfeit, prohibited, or illegal products.',
                'BELLMAK charges a platform commission on completed sales (as per the seller agreement).',
                'Sellers must fulfill orders within the committed timeframe and maintain a minimum seller rating.',
                'BELLMAK reserves the right to remove listings or suspend sellers who violate our policies.',
              ]
            },
            {
              title: '5. Prohibited Activities',
              content: [
                'Using BELLMAK for any unlawful, fraudulent, or malicious activity.',
                'Listing or selling counterfeit, stolen, or prohibited goods.',
                'Attempting to hack, scrape, or disrupt our platform or servers.',
                'Posting false reviews, fake ratings, or manipulating the platform.',
                'Harassing, threatening, or abusing other users or BELLMAK staff.',
                'Creating multiple accounts to circumvent suspensions or bans.',
              ]
            },
            {
              title: '6. BELLMAK Coins',
              content: [
                'BELLMAK Coins are a reward currency earned through purchases and activities on the platform.',
                'Coins have no cash value and cannot be transferred, sold, or redeemed for cash.',
                'Coins can be used for discounts on eligible purchases as per the current coin redemption rules.',
                'BELLMAK reserves the right to modify or discontinue the Coins program at any time.',
              ]
            },
            {
              title: '7. Returns & Refunds',
              content: [
                'We offer a 7-day return policy on most products, subject to the category-specific return rules.',
                'Products must be returned in their original condition and packaging.',
                'Refunds are processed to the original payment method within 5–7 business days of return approval.',
                'Certain categories (software, personal care, perishables) may not be eligible for return.',
                'To initiate a return, visit My Orders and select the relevant order.',
              ]
            },
            {
              title: '8. Intellectual Property',
              content: [
                'All content on BELLMAK (logos, design, code, text) is the property of BELLMAK and protected by Indian intellectual property laws.',
                'You may not copy, reproduce, or distribute our content without written permission.',
                'Sellers retain ownership of their product images and descriptions but grant BELLMAK a license to display them.',
              ]
            },
            {
              title: '9. Limitation of Liability',
              content: [
                'BELLMAK is a marketplace platform and is not liable for the quality, safety, or legality of products listed by sellers.',
                'We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
                'Our total liability to you shall not exceed the amount you paid for the specific order in dispute.',
              ]
            },
            {
              title: '10. Governing Law',
              content: [
                'These Terms are governed by the laws of India.',
                'Any disputes shall be subject to the exclusive jurisdiction of courts in India.',
                'We encourage users to resolve disputes amicably through our customer support first.',
              ]
            },
            {
              title: '11. Contact',
              content: [
                'For any questions about these Terms, contact us at support@bellmak.in.',
                'We aim to respond to all legal queries within 7 business days.',
              ]
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="font-black text-gray-900 text-base mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} BELLMAK. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="text-xs text-[#F97316] hover:underline font-bold">Privacy Policy</Link>
              <Link href="/contact" className="text-xs text-[#F97316] hover:underline font-bold">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}