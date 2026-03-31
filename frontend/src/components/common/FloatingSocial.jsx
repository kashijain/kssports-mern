import { Instagram, MessageCircle } from 'lucide-react';

const socialLinks = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/917082252531',
    icon: MessageCircle,
    className:
      'bg-[#25D366] text-white shadow-lg shadow-green-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/40',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/kssportsknl',
    icon: Instagram,
    className:
      'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg shadow-pink-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/35',
  },
];

const FloatingSocial = () => (
  <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
    {socialLinks.map(({ name, href, icon: Icon, className }) => (
      <a
        key={name}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={name}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${className}`}
      >
        <Icon size={22} />
      </a>
    ))}
  </div>
);

export default FloatingSocial;
