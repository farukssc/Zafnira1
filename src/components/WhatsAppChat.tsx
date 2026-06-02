import { Phone } from 'lucide-react';
import { Language } from '../types';

interface WhatsAppChatProps {
  number: string;
  lang: Language;
}

export default function WhatsAppChat(props: WhatsAppChatProps) {
  const defaultTextEn = 'Hello ZafNira! I am interested in inquiring about your pure Arabian spices and blends. Can you assist me?';
  const defaultTextAr = 'مرحباً زعفنيرا! أنا مهتم بالاستفسار عن مجموعتكم من البهارات والخلطات العربية الصافية. هل يمكنكم مساعدتي؟';
  const encodedMsg = encodeURIComponent(props.lang === 'ar' ? defaultTextAr : defaultTextEn);
  const whatsappUrl = `https://wa.me/${props.number.replace(/[\s+]/g, '')}?text=${encodedMsg}`;

  return (
    <a
      id="whatsapp-chat-button"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-medium p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 select-none group"
      title="Chat with ZafNira Spices"
    >
      <Phone className="w-6 h-6 animate-pulse" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-sm font-semibold">
        {props.lang === 'ar' ? 'تواصل معنا' : 'Chat with Us'}
      </span>
    </a>
  );
}
