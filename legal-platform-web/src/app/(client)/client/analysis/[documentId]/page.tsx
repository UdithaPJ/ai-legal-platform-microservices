export default async function AnalysisResultPage(props: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await props.params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Analysis Results</h1>
      <p className="text-muted-foreground mt-2">Document ID: {documentId}</p>
    </div>
  );
}
