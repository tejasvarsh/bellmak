"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// ✅ Gmail transporter — real emails bhejta hai sabko
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});
// Startup pe verify karo
transporter.verify((err, success) => {
    if (err)
        console.error('❌ Gmail connection failed:', err.message);
    else
        console.log('✅ Gmail ready — emails bhej sakta hai!');
});
const sendOTPEmail = async (email, otp, name) => {
    try {
        await transporter.sendMail({
            from: `"BELLMAK" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `${otp} - BELLMAK Password Reset OTP`,
            html: getEmailHTML(otp, name)
        });
        console.log(`✅ OTP email sent to ${email}`);
    }
    catch (err) {
        console.error('❌ Email error:', err.message);
        throw new Error('Email nahi gaya. Gmail settings check karo.');
    }
};
exports.sendOTPEmail = sendOTPEmail;
function getEmailHTML(otp, name) {
    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#F97316,#EA580C);padding:28px;text-align:center;">
      <div style="font-size:32px;margin-bottom:6px;">🛒</div>
      <h1 style="margin:0;color:white;font-size:24px;font-weight:900;">BELLMAK</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.1em;">INDIA KA APNA BAZAAR</p>
    </div>

    <div style="padding:36px;">
      <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:900;">Password Reset Request</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Namaste <strong style="color:#1a1a2e;">${name}</strong>! 👋<br>
        Aapne BELLMAK account ka password reset karne ki request ki hai.
        Neeche diya OTP use karo:
      </p>

      <div style="background:#fff7ed;border:2px dashed #F97316;border-radius:14px;padding:30px;text-align:center;margin:0 0 24px;">
        <p style="margin:0 0 10px;color:#9ca3af;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">
          Your OTP Code
        </p>
        <div style="font-size:52px;font-weight:900;color:#F97316;letter-spacing:0.35em;line-height:1;">
          ${otp}
        </div>
        <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
          ⏰ <strong style="color:#F97316;">10 minutes</strong> mein expire hoga
        </p>
      </div>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px 12px 12px 4px;padding:16px 18px;margin:0 0 20px;">
        <p style="margin:0 0 5px;color:#dc2626;font-size:13px;font-weight:800;">🔒 Security Warning</p>
        <p style="margin:0;color:#ef4444;font-size:12px;line-height:1.6;">
          Ye OTP sirf aapke liye hai. <strong>Kisi ke saath share mat karo</strong> —
          BELLMAK ka koi employee kabhi OTP nahi maangta.
        </p>
      </div>

      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
        Agar aapne ye request nahi ki — is email ko ignore karo. Aapka account safe hai.
      </p>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">
        © 2025 BELLMAK · Automated email — reply mat karo
      </p>
    </div>
  </div>
</body>
</html>`;
}
