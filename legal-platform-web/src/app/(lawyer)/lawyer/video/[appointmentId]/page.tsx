export default async function LawyerVideoPage(props: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await props.params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Video Session</h1>
      <p className="text-muted-foreground mt-2">Appointment ID: {appointmentId}</p>
    </div>
  );
}
