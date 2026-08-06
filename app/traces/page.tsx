import { redirect } from 'next/navigation';

export default function TracesRedirectPage() {
  redirect('/runs');
}
