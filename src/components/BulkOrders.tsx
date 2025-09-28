import { FaWhatsapp } from 'react-icons/fa';
import { Button } from './ui/button';
import { Package } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

export default function BulkOrder() {
  const BULK_ORDER_CONTACT = process.env.NEXT_PUBLIC_BULK_ORDER_CONTACT || '';
  return (
    <section className="py-8 bg-(--color-logo)/5 border-(--color-logo) border-2 rounded-xl mb-8">
      <div className="max-w-xl mx-auto px-4 text-center">
        <h2 className="inline-flex items-center gap-2 text-3xl font-semibold text-(--color-logo) mb-4">
          <Package />
          Bulk Orders
        </h2>
        <p className="text-muted-foreground mb-6">
          For bulk inquiries or wholesale requests, feel free to reach out via WhatsApp.
        </p>
        <Button asChild className="bg-(--color-logo) hover:bg-(--color-logo)/80">
          <a
            href={`https://wa.me/${BULK_ORDER_CONTACT}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact us on WhatsApp"
            className="inline-flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="w-5 h-5" />
            {formatPhoneNumber(BULK_ORDER_CONTACT)}
          </a>
        </Button>
      </div>
    </section>
  );
}
