import { redirect } from 'next/navigation';

export default async function LegacyRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/paths/${id}`);
}
