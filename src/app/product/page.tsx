import { redirect } from 'next/navigation';

export default function ProductRedirect() {
  redirect('/products');
  return null;
}
