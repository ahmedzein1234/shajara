import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Heart,
  Baby,
  Briefcase,
  GraduationCap,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';

// Mock data for demonstration
const mockPersonData = {
  '1': {
    id: '1',
    name: 'محمد أحمد الخليل',
    nameEn: 'Mohammed Ahmad Al-Khalil',
    photo: null,
    birthDate: '1950-03-15',
    birthPlace: 'دمشق، سوريا',
    birthPlaceEn: 'Damascus, Syria',
    deathDate: null,
    occupation: 'مهندس معماري',
    occupationEn: 'Architect',
    education: 'جامعة دمشق - هندسة معمارية',
    educationEn: 'Damascus University - Architecture',
    bio: 'مهندس معماري بارز، ساهم في تصميم العديد من المباني الشهيرة في دمشق. عُرف بحبه للتراث المعماري الإسلامي وإدماجه في تصاميمه الحديثة.',
    bioEn: 'Distinguished architect who contributed to designing many famous buildings in Damascus. Known for his love of Islamic architectural heritage and integrating it into modern designs.',
    relationships: [
      { id: 'r1', type: 'زوج/زوجة', typeEn: 'Spouse', name: 'فاطمة حسن', nameEn: 'Fatima Hassan', since: '1975' },
      { id: 'r2', type: 'ابن', typeEn: 'Son', name: 'أحمد محمد', nameEn: 'Ahmad Mohammed', since: '1976' },
      { id: 'r3', type: 'ابنة', typeEn: 'Daughter', name: 'نور محمد', nameEn: 'Nour Mohammed', since: '1980' },
      { id: 'r4', type: 'والد', typeEn: 'Father', name: 'أحمد الخليل', nameEn: 'Ahmad Al-Khalil', since: null },
    ],
    timeline: [
      { year: '1950', event: 'الولادة في دمشق', eventEn: 'Born in Damascus', type: 'birth' },
      { year: '1968', event: 'التحق بجامعة دمشق', eventEn: 'Enrolled at Damascus University', type: 'education' },
      { year: '1972', event: 'تخرج بدرجة البكالوريوس', eventEn: 'Graduated with Bachelor\'s degree', type: 'education' },
      { year: '1975', event: 'الزواج من فاطمة حسن', eventEn: 'Married Fatima Hassan', type: 'marriage' },
      { year: '1976', event: 'ولادة الابن أحمد', eventEn: 'Birth of son Ahmad', type: 'child' },
      { year: '1980', event: 'ولادة الابنة نور', eventEn: 'Birth of daughter Nour', type: 'child' },
      { year: '1985', event: 'افتتح مكتبه الخاص', eventEn: 'Opened his own office', type: 'work' },
    ],
    photos: [
      { id: 'p1', title: 'صورة عائلية', titleEn: 'Family Photo', year: '1990' },
      { id: 'p2', title: 'حفل التخرج', titleEn: 'Graduation', year: '1972' },
      { id: 'p3', title: 'حفل الزفاف', titleEn: 'Wedding', year: '1975' },
    ],
  },
};

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const person = mockPersonData[id as keyof typeof mockPersonData] || mockPersonData['1'];

  const age = person.birthDate
    ? new Date().getFullYear() - new Date(person.birthDate).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/${locale}/tree/1`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'ar' ? 'العودة إلى الشجرة' : 'Back to Tree'}</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                {person.photo ? (
                  <img src={person.photo} alt={person.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <span className="text-6xl font-bold text-white">
                    {(locale === 'ar' ? person.name : person.nameEn).charAt(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {locale === 'ar' ? person.name : person.nameEn}
              </h1>

              <div className="flex flex-wrap gap-4 mb-6">
                {person.birthDate && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(person.birthDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {age && ` (${age} ${locale === 'ar' ? 'سنة' : 'years'})`}
                    </span>
                  </div>
                )}

                {person.birthPlace && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span>{locale === 'ar' ? person.birthPlace : person.birthPlaceEn}</span>
                  </div>
                )}

                {person.occupation && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Briefcase className="w-4 h-4" />
                    <span>{locale === 'ar' ? person.occupation : person.occupationEn}</span>
                  </div>
                )}
              </div>

              <Link href={`/${locale}/person/${id}/edit`} className="btn-secondary inline-flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Biography */}
            {person.bio && (
              <div className="card">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                  <span>{locale === 'ar' ? 'السيرة الذاتية' : 'Biography'}</span>
                </h2>
                <p className="text-slate-700 leading-relaxed text-lg">
                  {locale === 'ar' ? person.bio : person.bioEn}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-600" />
                <span>{locale === 'ar' ? 'الجدول الزمني' : 'Timeline'}</span>
              </h2>

              <div className="space-y-6">
                {person.timeline.map((event, index) => {
                  const iconMap = {
                    birth: <Baby className="w-5 h-5" />,
                    education: <GraduationCap className="w-5 h-5" />,
                    marriage: <Heart className="w-5 h-5" />,
                    child: <Baby className="w-5 h-5" />,
                    work: <Briefcase className="w-5 h-5" />,
                  };

                  return (
                    <div key={index} className="flex gap-4 group">
                      {/* Year Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-smooth">
                          {iconMap[event.type as keyof typeof iconMap] || <Calendar className="w-5 h-5" />}
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-grow pt-1">
                        <div className="text-sm font-bold text-emerald-600 mb-1">{event.year}</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {locale === 'ar' ? event.event : event.eventEn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="card">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-emerald-600" />
                <span>{locale === 'ar' ? 'معرض الصور' : 'Photo Gallery'}</span>
              </h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {person.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition-smooth cursor-pointer group"
                  >
                    <ImageIcon className="w-12 h-12 text-slate-400 mb-2 group-hover:text-slate-600 transition-smooth" />
                    <div className="text-sm font-semibold text-slate-700">
                      {locale === 'ar' ? photo.title : photo.titleEn}
                    </div>
                    <div className="text-xs text-slate-500">{photo.year}</div>
                  </div>
                ))}

                {/* Add Photo Button */}
                <div className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-smooth cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2 group-hover:bg-emerald-200 transition-smooth">
                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-smooth" />
                  </div>
                  <div className="text-sm font-semibold text-slate-600 group-hover:text-emerald-600">
                    {locale === 'ar' ? 'إضافة صورة' : 'Add Photo'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Relationships */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-emerald-600" />
                <span>{locale === 'ar' ? 'العلاقات' : 'Relationships'}</span>
              </h2>

              <div className="space-y-4">
                {person.relationships.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/person/${rel.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-smooth border border-slate-200 hover:border-emerald-300"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(locale === 'ar' ? rel.name : rel.nameEn).charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {locale === 'ar' ? rel.name : rel.nameEn}
                      </div>
                      <div className="text-sm text-slate-600">
                        {locale === 'ar' ? rel.type : rel.typeEn}
                        {rel.since && ` • ${rel.since}`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Add Relationship Button */}
              <button className="mt-6 w-full btn-outline flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                <span>{locale === 'ar' ? 'إضافة علاقة' : 'Add Relationship'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
