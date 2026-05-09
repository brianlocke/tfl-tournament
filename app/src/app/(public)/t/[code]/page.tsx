interface Props {
  params: Promise<{ code: string }>;
}

export default async function TournamentPublicPage({ params }: Props) {
  const { code } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-5xl text-white mb-4">Tournament</h1>
      <p className="text-slate-400">Join code: {code}</p>
    </div>
  );
}
