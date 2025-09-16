import { redirect } from 'next/navigation';

export default function ProductRedirect() {
  redirect('/category');
  return null;
}
