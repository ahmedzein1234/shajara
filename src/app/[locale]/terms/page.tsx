/**
 * Terms of Service Page
 */

import Link from 'next/link';

export default async function TermsPage({
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
            {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
          </h1>

          <p className="text-slate-600 mb-8">
            {isArabic
              ? `آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}`
              : `Last updated: ${new Date().toLocaleDateString('en-US')}`}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <p className="text-amber-800">
              {isArabic
                ? 'باستخدام شجرة، فإنك توافق على هذه الشروط. يرجى قراءتها بعناية.'
                : 'By using Shajara, you agree to these terms. Please read them carefully.'}
            </p>
          </div>

          {content.sections.map((section, index) => (
            <section key={index} className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                {index + 1}. {section.title}
              </h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}

          <section className="mt-12 p-6 bg-slate-100 rounded-xl">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {isArabic ? 'هل لديك أسئلة؟' : 'Have Questions?'}
            </h2>
            <p className="text-slate-600 mb-4">
              {isArabic
                ? 'إذا كانت لديك أي أسئلة حول شروط الخدمة هذه، يمكنك الاتصال بنا:'
                : 'If you have any questions about these Terms, you can contact us:'}
            </p>
            <p className="font-medium text-slate-800">legal@shajara.app</p>
          </section>

          <div className="mt-8 flex gap-4">
            <Link
              href={`/${locale}/privacy`}
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

const englishContent = {
  sections: [
    {
      title: 'Acceptance of Terms',
      content: `By accessing or using Shajara ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

These Terms apply to all visitors, users, and others who access or use the Service.`,
    },
    {
      title: 'Description of Service',
      content: `Shajara is a family tree application that allows you to:
• Create and manage family trees
• Store family member information
• Connect with family members
• Use AI-powered features to help build your tree

We reserve the right to modify or discontinue the Service at any time without notice.`,
    },
    {
      title: 'User Accounts',
      content: `When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.

You are responsible for:
• Safeguarding the password used to access the Service
• Any activities or actions under your password
• Notifying us immediately of any unauthorized access

You must not use as a username the name of another person or entity that you are not authorized to use, or a name that is offensive, vulgar, or obscene.`,
    },
    {
      title: 'User Content',
      content: `You retain ownership of content you submit to the Service ("User Content"). By submitting User Content, you grant us a license to use, modify, and display that content as necessary to provide the Service.

You represent that:
• You own the User Content or have rights to use it
• The content does not violate any third party rights
• The content is not unlawful, harmful, or offensive

We may remove content that violates these Terms or that we find objectionable.`,
    },
    {
      title: 'Prohibited Uses',
      content: `You may not use the Service:
• To violate any laws or regulations
• To harass, abuse, or harm another person
• To impersonate any person or entity
• To upload viruses or malicious code
• To collect user information without consent
• To interfere with the Service's operation
• To attempt to gain unauthorized access
• For any commercial purpose without our consent

Violation of these prohibitions may result in termination of your account.`,
    },
    {
      title: 'Family Data and Privacy',
      content: `When adding family members to your tree:
• You must have their consent or legal authority to include their information
• You are responsible for the accuracy of information you enter
• Deceased individuals may be added without consent, but with respect
• You should not include sensitive personal information of others without consent

Private trees are only visible to invited members. Public trees may be visible to all users.`,
    },
    {
      title: 'Intellectual Property',
      content: `The Service and its original content (excluding User Content) remain the exclusive property of Shajara and its licensors. Our trademarks and trade dress may not be used without prior written consent.

The open-source components of our software are licensed under their respective licenses.`,
    },
    {
      title: 'Termination',
      content: `We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms.

Upon termination:
• Your right to use the Service will cease immediately
• You may request an export of your data within 30 days
• We may delete your data after the retention period

All provisions of the Terms which should survive termination shall survive.`,
    },
    {
      title: 'Disclaimer',
      content: `The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not warrant that:
• The Service will be uninterrupted or error-free
• Defects will be corrected
• The Service is free of viruses or harmful components

Your use of the Service is at your sole risk.`,
    },
    {
      title: 'Limitation of Liability',
      content: `To the maximum extent permitted by law, Shajara shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including:
• Loss of profits or data
• Service interruption
• Computer damage or system failure

Our total liability shall not exceed the amount you paid us in the past 12 months.`,
    },
    {
      title: 'Governing Law',
      content: `These Terms shall be governed by the laws of the jurisdiction where we operate, without regard to its conflict of law provisions.

Any disputes arising from these Terms shall be resolved through binding arbitration, except where prohibited by law.`,
    },
    {
      title: 'Changes to Terms',
      content: `We reserve the right to modify these Terms at any time. We will notify you of material changes by:
• Posting the new Terms on this page
• Updating the "Last updated" date
• Sending an email notification (for significant changes)

Your continued use of the Service after changes constitutes acceptance of the new Terms.`,
    },
  ],
};

const arabicContent = {
  sections: [
    {
      title: 'قبول الشروط',
      content: `باستخدام شجرة ("الخدمة")، فإنك توافق على الالتزام بشروط الخدمة هذه ("الشروط"). إذا كنت لا توافق على أي جزء من هذه الشروط، فلا يجوز لك استخدام الخدمة.

تنطبق هذه الشروط على جميع الزوار والمستخدمين وغيرهم ممن يستخدمون الخدمة.`,
    },
    {
      title: 'وصف الخدمة',
      content: `شجرة هو تطبيق شجرة عائلة يتيح لك:
• إنشاء وإدارة شجرات العائلة
• تخزين معلومات أفراد العائلة
• التواصل مع أفراد العائلة
• استخدام ميزات الذكاء الاصطناعي للمساعدة في بناء شجرتك

نحتفظ بالحق في تعديل أو إيقاف الخدمة في أي وقت دون إشعار.`,
    },
    {
      title: 'حسابات المستخدمين',
      content: `عند إنشاء حساب معنا، يجب عليك تقديم معلومات دقيقة وكاملة وحديثة. يشكل عدم القيام بذلك انتهاكاً للشروط.

أنت مسؤول عن:
• حماية كلمة المرور المستخدمة للوصول إلى الخدمة
• أي أنشطة أو إجراءات تتم تحت كلمة المرور الخاصة بك
• إخطارنا فوراً بأي وصول غير مصرح به

يجب ألا تستخدم كاسم مستخدم اسم شخص أو كيان آخر غير مصرح لك باستخدامه، أو اسم مسيء أو بذيء.`,
    },
    {
      title: 'محتوى المستخدم',
      content: `أنت تحتفظ بملكية المحتوى الذي تقدمه للخدمة ("محتوى المستخدم"). بتقديم محتوى المستخدم، فإنك تمنحنا ترخيصاً لاستخدام هذا المحتوى وتعديله وعرضه حسب الضرورة لتقديم الخدمة.

أنت تقر بأن:
• تملك محتوى المستخدم أو لديك حقوق استخدامه
• المحتوى لا ينتهك أي حقوق لأطراف ثالثة
• المحتوى ليس غير قانوني أو ضار أو مسيء

قد نزيل المحتوى الذي ينتهك هذه الشروط أو الذي نجده مرفوضاً.`,
    },
    {
      title: 'الاستخدامات المحظورة',
      content: `لا يجوز لك استخدام الخدمة:
• لانتهاك أي قوانين أو لوائح
• لمضايقة أو إساءة أو إيذاء شخص آخر
• لانتحال شخصية أي شخص أو كيان
• لتحميل فيروسات أو تعليمات برمجية ضارة
• لجمع معلومات المستخدم دون موافقة
• للتدخل في تشغيل الخدمة
• لمحاولة الحصول على وصول غير مصرح به
• لأي غرض تجاري دون موافقتنا

قد يؤدي انتهاك هذه المحظورات إلى إنهاء حسابك.`,
    },
    {
      title: 'بيانات العائلة والخصوصية',
      content: `عند إضافة أفراد العائلة إلى شجرتك:
• يجب أن تحصل على موافقتهم أو سلطة قانونية لتضمين معلوماتهم
• أنت مسؤول عن دقة المعلومات التي تدخلها
• يجوز إضافة الأشخاص المتوفين دون موافقة، ولكن باحترام
• يجب عدم تضمين معلومات شخصية حساسة للآخرين دون موافقة

الشجرات الخاصة مرئية فقط للأعضاء المدعوين. قد تكون الشجرات العامة مرئية لجميع المستخدمين.`,
    },
    {
      title: 'الملكية الفكرية',
      content: `تظل الخدمة ومحتواها الأصلي (باستثناء محتوى المستخدم) ملكية حصرية لشجرة والمرخصين لها. لا يجوز استخدام علاماتنا التجارية دون موافقة كتابية مسبقة.

المكونات مفتوحة المصدر من برنامجنا مرخصة بموجب تراخيصها الخاصة.`,
    },
    {
      title: 'الإنهاء',
      content: `قد نقوم بإنهاء أو تعليق حسابك فوراً، دون إشعار مسبق، لأي سبب، بما في ذلك انتهاك هذه الشروط.

عند الإنهاء:
• سيتوقف حقك في استخدام الخدمة فوراً
• يمكنك طلب تصدير بياناتك خلال 30 يوماً
• قد نحذف بياناتك بعد فترة الاحتفاظ

جميع أحكام الشروط التي يجب أن تظل سارية بعد الإنهاء ستظل سارية.`,
    },
    {
      title: 'إخلاء المسؤولية',
      content: `يتم تقديم الخدمة "كما هي" و"حسب التوفر" دون ضمانات من أي نوع. نحن لا نضمن أن:
• ستكون الخدمة بدون انقطاع أو خالية من الأخطاء
• سيتم تصحيح العيوب
• الخدمة خالية من الفيروسات أو المكونات الضارة

استخدامك للخدمة على مسؤوليتك الخاصة.`,
    },
    {
      title: 'تحديد المسؤولية',
      content: `إلى أقصى حد يسمح به القانون، لن تكون شجرة مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، بما في ذلك:
• خسارة الأرباح أو البيانات
• انقطاع الخدمة
• تلف الكمبيوتر أو فشل النظام

لن تتجاوز مسؤوليتنا الإجمالية المبلغ الذي دفعته لنا في الأشهر الـ 12 الماضية.`,
    },
    {
      title: 'القانون الحاكم',
      content: `تخضع هذه الشروط لقوانين الولاية القضائية التي نعمل فيها، بغض النظر عن أحكام تعارض القوانين.

يتم حل أي نزاعات ناشئة عن هذه الشروط من خلال التحكيم الملزم، باستثناء ما يحظره القانون.`,
    },
    {
      title: 'التغييرات على الشروط',
      content: `نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطرك بالتغييرات الجوهرية عن طريق:
• نشر الشروط الجديدة على هذه الصفحة
• تحديث تاريخ "آخر تحديث"
• إرسال إشعار بالبريد الإلكتروني (للتغييرات الهامة)

استمرارك في استخدام الخدمة بعد التغييرات يشكل قبولاً للشروط الجديدة.`,
    },
  ],
};
