interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageTournamentPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl text-white mb-6">Manage Tournament</h1>
      <p className="text-slate-400">Tournament ID: {id}</p>
    </div>
  );
}
