import Link from 'next/link'

export default function PrivacyPolicyPage() {
  const lastUpdated = 'March 2025'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a1a2e] py-12 text-center">
        <span className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
          🔒 Legal
        </span>
        <h1 className="text-3xl font-black text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8">

          {/* Intro */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              BELLMAK ("we", "our", "us") is committed to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, and share information when you use our platform at bellmak.in.
            </p>
          </div>

          {[
            {
              title: '1. Information We Collect',
              content: [
                'Account Information: When you register, we collect your name, email address, phone number, and role (buyer/seller).',
                'Order Information: We collect shipping addresses, payment method details, and order history to process your transactions.',
                'Device & Usage Data: We automatically collect information about your device, browser, IP address, and how you interact with our platform.',
                'Communications: If you contact us via email or our contact form, we retain those communications.',
              ]
            },
            {
              title: '2. How We Use Your Information',
              content: [
                'To process and deliver your orders, and communicate about order status.',
                'To create and manage your account on BELLMAK.',
                'To send you important updates, offers, and promotional emails (you can unsubscribe anytime).',
                'To improve our platform, fix bugs, and develop new features.',
                'To detect and prevent fraud, abuse, and security incidents.',
                'To comply with applicable Indian laws and regulations.',
              ]
            },
            {
              title: '3. Information Sharing',
              content: [
                'Sellers: When you place an order, your name, address, and contact details are shared with the seller to fulfill your order.',
                'Payment Partners: We share necessary payment data with Razorpay and other payment processors. We do not store full card details.',
                'Delivery Partners: Shipping details are shared with courier and logistics partners.',
                'Legal Requirements: We may disclose your information when required by law, court order, or government authority.',
                'We do NOT sell your personal data to third parties for advertising purposes.',
              ]
            },
            {
              title: '4. Data Security',
              content: [
                'We use industry-standard SSL/TLS encryption for all data transmitted on our platform.',
                'Passwords are hashed and never stored in plain text.',
                'We conduct regular security reviews to protect your information.',
                'Despite our efforts, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords.',
              ]
            },
            {
              title: '5. Cookies',
              content: [
                'We use cookies and similar tracking technologies to improve your experience on BELLMAK.',
                'Essential cookies are required for the platform to function (login sessions, cart data).',
                'Analytics cookies help us understand how users interact with our platform.',
                'You can disable cookies in your browser settings, but some features may not work correctly.',
              ]
            },
            {
              title: '6. Your Rights',
              content: [
                'Access: You can view the personal data we hold about you from your Account Settings.',
                'Correction: You can update your personal information at any time from your profile.',
                'Deletion: You can request deletion of your account and data by contacting support@bellmak.in.',
                'Opt-out: You can unsubscribe from marketing emails using the link in any email we send.',
              ]
            },
            {
              title: '7. Children\'s Privacy',
              content: [
                'BELLMAK is not intended for users under the age of 18.',
                'We do not knowingly collect personal information from minors.',
                'If you believe a minor has provided us with their data, please contact us immediately.',
              ]
            },
            {
              title: '8. Changes to This Policy',
              content: [
                'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our platform.',
                'Your continued use of BELLMAK after changes are posted constitutes your acceptance of the updated policy.',
              ]
            },
            {
              title: '9. Contact Us',
              content: [
                'If you have any questions about this Privacy Policy, please contact us at support@bellmak.in.',
                'We will respond to all privacy-related inquiries within 7 business days.',
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
              <Link href="/terms" className="text-xs text-[#F97316] hover:underline font-bold">Terms & Conditions</Link>
              <Link href="/contact" className="text-xs text-[#F97316] hover:underline font-bold">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}