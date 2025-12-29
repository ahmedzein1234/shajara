/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy for Shajara
 */

import Link from 'next/link';

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  const content = isArabic ? arabicContent : englishContent;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">
            {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>

          <p className="text-slate-600 mb-8">
            {isArabic
              ? `آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}`
              : `Last updated: ${new Date().toLocaleDateString('en-US')}`}
          </p>

          {content.sections.map((section, index) => (
            <section key={index} className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">{section.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
              {section.list && (
                <ul className="list-disc list-inside mt-4 space-y-2 text-slate-600">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-12 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <h2 className="text-xl font-semibold text-emerald-800 mb-4">
              {isArabic ? 'حقوقك' : 'Your Rights'}
            </h2>
            <p className="text-emerald-700 mb-4">
              {isArabic
                ? 'بموجب قوانين حماية البيانات، لديك الحقوق التالية:'
                : 'Under data protection laws, you have the following rights:'}
            </p>
            <ul className="space-y-2 text-emerald-700">
              {content.rights.map((right, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  {right}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href={`/${locale}/settings`}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {isArabic ? 'إدارة بياناتي' : 'Manage My Data'}
              </Link>
            </div>
          </section>

          <section className="mt-12 text-slate-600">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              {isArabic ? 'اتصل بنا' : 'Contact Us'}
            </h2>
            <p>
              {isArabic
                ? 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يمكنك الاتصال بنا على:'
                : 'If you have any questions about this Privacy Policy, you can contact us at:'}
            </p>
            <p className="mt-2 font-medium">privacy@shajara.app</p>
          </section>
        </article>
      </div>
    </div>
  );
}

const englishContent = {
  sections: [
    {
      title: 'Introduction',
      content: `Shajara ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our family tree application.

We process personal data in accordance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.`,
    },
    {
      title: 'Information We Collect',
      content: 'We collect information that you provide directly to us:',
      list: [
        'Account information (name, email address, password)',
        'Family tree data (names, dates, places, relationships)',
        'Photos and documents you upload',
        'Communications with us',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: 'We use the information we collect to:',
      list: [
        'Provide, maintain, and improve our services',
        'Process and complete transactions',
        'Send you technical notices and support messages',
        'Respond to your comments and questions',
        'Analyze usage patterns to improve user experience',
      ],
    },
    {
      title: 'Legal Basis for Processing',
      content: `We process your personal data based on:

• Contract: To provide our services to you
• Consent: For optional features like marketing communications
• Legitimate Interest: To improve our services and prevent fraud
• Legal Obligation: To comply with applicable laws`,
    },
    {
      title: 'Data Sharing',
      content: `We do not sell your personal data. We may share information with:

• Service providers who assist in our operations
• Legal authorities when required by law
• Other users only when you explicitly share your family tree

Family tree data is private by default and only shared with users you invite.`,
    },
    {
      title: 'Data Retention',
      content: `We retain your personal data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.

After account deletion, we may retain anonymized data for analytical purposes.`,
    },
    {
      title: 'Data Security',
      content: `We implement appropriate technical and organizational measures to protect your data:

• Encryption in transit (HTTPS) and at rest
• Secure password hashing (bcrypt)
• Regular security audits
• Access controls and monitoring`,
    },
    {
      title: 'International Transfers',
      content: `Your data is processed on Cloudflare's global network. Cloudflare maintains appropriate safeguards for international data transfers, including EU Standard Contractual Clauses.`,
    },
    {
      title: 'Cookies',
      content: `We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.

You can control cookies through your browser settings, but disabling essential cookies may prevent you from using our services.`,
    },
    {
      title: 'Children\'s Privacy',
      content: `Our services are not intended for children under 16. We do not knowingly collect personal data from children under 16. If you believe we have collected data from a child, please contact us immediately.`,
    },
  ],
  rights: [
    'Right to access your personal data',
    'Right to correct inaccurate data',
    'Right to delete your data (right to be forgotten)',
    'Right to data portability (export your data)',
    'Right to restrict processing',
    'Right to object to processing',
    'Right to withdraw consent',
  ],
};

const arabicContent = {
  sections: [
    {
      title: 'مقدمة',
      content: `شجرة ("نحن" أو "لنا") ملتزمة بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام والإفصاح عن معلوماتك وحمايتها عند استخدام تطبيق شجرة العائلة.

نعالج البيانات الشخصية وفقاً للائحة العامة لحماية البيانات (GDPR) وقوانين حماية البيانات الأخرى المعمول بها.`,
    },
    {
      title: 'المعلومات التي نجمعها',
      content: 'نجمع المعلومات التي تقدمها لنا مباشرة:',
      list: [
        'معلومات الحساب (الاسم، البريد الإلكتروني، كلمة المرور)',
        'بيانات شجرة العائلة (الأسماء، التواريخ، الأماكن، العلاقات)',
        'الصور والوثائق التي تقوم بتحميلها',
        'التواصل معنا',
      ],
    },
    {
      title: 'كيف نستخدم معلوماتك',
      content: 'نستخدم المعلومات التي نجمعها من أجل:',
      list: [
        'تقديم خدماتنا وصيانتها وتحسينها',
        'معالجة المعاملات وإتمامها',
        'إرسال إشعارات فنية ورسائل الدعم',
        'الرد على تعليقاتك وأسئلتك',
        'تحليل أنماط الاستخدام لتحسين تجربة المستخدم',
      ],
    },
    {
      title: 'الأساس القانوني للمعالجة',
      content: `نعالج بياناتك الشخصية بناءً على:

• العقد: لتقديم خدماتنا لك
• الموافقة: للميزات الاختيارية مثل رسائل التسويق
• المصلحة المشروعة: لتحسين خدماتنا ومنع الاحتيال
• الالتزام القانوني: للامتثال للقوانين المعمول بها`,
    },
    {
      title: 'مشاركة البيانات',
      content: `نحن لا نبيع بياناتك الشخصية. قد نشارك المعلومات مع:

• مقدمي الخدمات الذين يساعدون في عملياتنا
• السلطات القانونية عند الطلب بموجب القانون
• مستخدمين آخرين فقط عندما تشارك شجرة عائلتك بشكل صريح

بيانات شجرة العائلة خاصة بشكل افتراضي ولا تتم مشاركتها إلا مع المستخدمين الذين تدعوهم.`,
    },
    {
      title: 'الاحتفاظ بالبيانات',
      content: `نحتفظ ببياناتك الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات. يمكنك طلب حذف بياناتك في أي وقت.

بعد حذف الحساب، قد نحتفظ ببيانات مجهولة الهوية لأغراض التحليل.`,
    },
    {
      title: 'أمان البيانات',
      content: `نطبق التدابير الفنية والتنظيمية المناسبة لحماية بياناتك:

• التشفير أثناء النقل (HTTPS) وفي حالة السكون
• تجزئة آمنة لكلمات المرور (bcrypt)
• عمليات تدقيق أمنية منتظمة
• ضوابط الوصول والمراقبة`,
    },
    {
      title: 'النقل الدولي',
      content: `تتم معالجة بياناتك على شبكة Cloudflare العالمية. تحافظ Cloudflare على الضمانات المناسبة لنقل البيانات الدولية، بما في ذلك البنود التعاقدية القياسية للاتحاد الأوروبي.`,
    },
    {
      title: 'ملفات تعريف الارتباط',
      content: `نستخدم ملفات تعريف الارتباط الأساسية للمصادقة وإدارة الجلسات. لا نستخدم ملفات تعريف الارتباط للتتبع أو الإعلانات من جهات خارجية.

يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح، لكن تعطيل ملفات تعريف الارتباط الأساسية قد يمنعك من استخدام خدماتنا.`,
    },
    {
      title: 'خصوصية الأطفال',
      content: `خدماتنا غير موجهة للأطفال دون سن 16 عاماً. نحن لا نجمع عن قصد بيانات شخصية من الأطفال دون سن 16 عاماً. إذا كنت تعتقد أننا جمعنا بيانات من طفل، يرجى الاتصال بنا فوراً.`,
    },
  ],
  rights: [
    'الحق في الوصول إلى بياناتك الشخصية',
    'الحق في تصحيح البيانات غير الدقيقة',
    'الحق في حذف بياناتك (الحق في النسيان)',
    'الحق في نقل البيانات (تصدير بياناتك)',
    'الحق في تقييد المعالجة',
    'الحق في الاعتراض على المعالجة',
    'الحق في سحب الموافقة',
  ],
};
