import { redirect } from 'next/navigation';

export default async function LegacyPathRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/runs/${id}`);
}
